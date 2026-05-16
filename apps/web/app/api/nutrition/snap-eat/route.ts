import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getDb, ensureUser } from '@forja/api-client';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MODEL_TIMEOUT_MS = 25_000;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const imageBase64: string | undefined = body?.image_base64;
    const mealType: string = body?.meal_type ?? 'almuerzo';

    // Validate
    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 });
    }
    if (imageBase64.length > MAX_IMAGE_BYTES * 1.4) {  // base64 ~33% overhead
      return NextResponse.json({ error: 'Imagen muy grande' }, { status: 400 });
    }
    if (!['desayuno', 'almuerzo', 'cena', 'snack'].includes(mealType)) {
      return NextResponse.json({ error: 'meal_type inválido' }, { status: 400 });
    }

    // Resolve user
    const user = await currentUser().catch(() => null);
    const email = user?.emailAddresses[0]?.emailAddress ?? '';
    const name = user?.firstName ?? '';
    const dbUserId = await ensureUser(userId, email, name);
    const sql = getDb();

    // Call Claude vision with timeout
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

    const prompt = `Analiza esta foto de comida y responde SOLO en JSON con este formato exacto:
{
  "description": "string descriptivo (ej: 'Pollo a la plancha con arroz y ensalada')",
  "kcal": número estimado total,
  "protein_g": número estimado,
  "carbs_g": número estimado,
  "fat_g": número estimado,
  "confidence_score": número entre 0 y 1 según qué tan seguro estás
}
Si no puedes identificar la comida con razonable confianza, devuelve confidence_score: 0 y kcal: 0.`;

    let message;
    try {
      message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        }],
      }, { signal: controller.signal });
    } catch (e: any) {
      clearTimeout(timer);
      if (e?.name === 'AbortError') {
        return NextResponse.json({ error: 'La identificación tardó demasiado. Intenta de nuevo.' }, { status: 504 });
      }
      throw e;
    }
    clearTimeout(timer);

    // Parse Claude response with type guard
    const first = message.content[0];
    if (!first || first.type !== 'text') {
      return NextResponse.json({ error: 'No se pudo identificar la comida.' }, { status: 500 });
    }
    const raw = first.text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'No se pudo procesar el análisis.' }, { status: 500 });
    }

    // Validate parsed shape
    const desc = String(parsed.description ?? '').slice(0, 200) || 'Comida';
    const kcal = Math.max(0, Math.round(Number(parsed.kcal) || 0));
    const proteinG = Math.max(0, Number(parsed.protein_g) || 0);
    const carbsG = Math.max(0, Number(parsed.carbs_g) || 0);
    const fatG = Math.max(0, Number(parsed.fat_g) || 0);
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence_score) || 0));

    // If low confidence, return preview without persisting (let user confirm)
    if (confidence < 0.3) {
      return NextResponse.json({
        preview: true,
        confidence_score: confidence,
        description: desc,
        kcal, protein_g: proteinG, carbs_g: carbsG, fat_g: fatG,
        message: 'No estoy seguro de qué es esto — confirma o edita los datos antes de registrarlo.',
      });
    }

    // Persist to food_logs + update daily_nutrition
    const todayISO = new Date().toISOString().split('T')[0];
    const inserted = await sql`
      INSERT INTO food_logs (user_id, date, meal_type, description, kcal, protein_g, carbs_g, fat_g, logged_via, confidence_score)
      VALUES (${dbUserId}, ${todayISO}, ${mealType}, ${desc}, ${kcal}, ${proteinG}, ${carbsG}, ${fatG}, 'snap_eat', ${confidence})
      RETURNING *
    `;

    await sql`
      INSERT INTO daily_nutrition (user_id, date, kcal_consumed, protein_g, carbs_g, fat_g, kcal_goal, protein_goal)
      VALUES (${dbUserId}, ${todayISO}, ${kcal}, ${proteinG}, ${carbsG}, ${fatG}, 2200, 150)
      ON CONFLICT (user_id, date) DO UPDATE SET
        kcal_consumed = daily_nutrition.kcal_consumed + EXCLUDED.kcal_consumed,
        protein_g = daily_nutrition.protein_g + EXCLUDED.protein_g,
        carbs_g = daily_nutrition.carbs_g + EXCLUDED.carbs_g,
        fat_g = daily_nutrition.fat_g + EXCLUDED.fat_g,
        updated_at = now()
    `;

    if (!inserted?.[0]) {
      return NextResponse.json({ error: 'No se pudo registrar la comida.' }, { status: 500 });
    }

    return NextResponse.json({
      preview: false,
      confidence_score: confidence,
      ...inserted[0],
    });
  } catch (err: any) {
    console.error('snap-eat error:', err);
    return NextResponse.json({ error: 'No se pudo procesar la imagen. Intenta de nuevo.' }, { status: 500 });
  }
}
