#!/usr/bin/env node

/**
 * scripts/generate-images.js
 *
 * Генерирует 22 фуд-фотографии для Lunchistan.
 * Сначала пробует Google Gemini API, при неудаче — SVG-плейсхолдеры.
 * Сохраняет изображения в public/images/sets/day-{N}.jpg
 *
 * Использование: npm run generate-images
 */

import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

config({ path: resolve(ROOT, '.env') });

const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = resolve(ROOT, 'public/images/sets');

// 22 блюда
const DISHES = [
  { day: 1,  name: 'Гушт сай с лепёшкой',              prompt: 'Professional studio food photography of traditional Uzbek Gousht soy stew with meat and vegetables, served with fresh flatbread on a rustic wooden table' },
  { day: 2,  name: 'Курица с грибами и рисом',          prompt: 'Professional studio food photography of chicken and mushroom sauté served on steamed rice, garnished with fresh herbs' },
  { day: 3,  name: 'Куриный стейк в кисло-сладком соусе, гречка', prompt: 'Professional studio food photography of grilled chicken steak glazed with sweet and sour sauce, served with buckwheat' },
  { day: 4,  name: 'Гуляш с картофельным пюре',         prompt: 'Professional studio food photography of rich beef goulash served over creamy mashed potatoes' },
  { day: 5,  name: 'Котлеты по-киевски, картофель фри',  prompt: 'Professional studio food photography of crispy Chicken Kiev with french fries' },
  { day: 6,  name: 'Рыба запечённая с рисом',           prompt: 'Professional studio food photography of baked fish fillet with lemon on white rice' },
  { day: 7,  name: 'Плов свадебный',                    prompt: 'Professional studio food photography of traditional Uzbek wedding plov with lamb and carrots' },
  { day: 8,  name: 'Бефстроганов с гречкой',            prompt: 'Professional studio food photography of creamy beef stroganoff with buckwheat' },
  { day: 9,  name: 'Парамач с фаршем',                  prompt: 'Professional studio food photography of golden fried pies filled with minced meat' },
  { day: 10, name: 'Лагман с мантами',                  prompt: 'Professional studio food photography of hearty Uzbek lagman noodle soup with manti dumplings' },
  { day: 11, name: 'Чикен терияки с рисом',             prompt: 'Professional studio food photography of glossy chicken teriyaki with rice and sesame' },
  { day: 12, name: 'Кебаб с овощами гриль',             prompt: 'Professional studio food photography of grilled meat kebab with vegetables on wooden platter' },
  { day: 13, name: 'Бифштекс с пюре',                   prompt: 'Professional studio food photography of juicy beef steak with mashed potatoes' },
  { day: 14, name: 'Плов домашний',                     prompt: 'Professional studio food photography of homemade Uzbek plov with beef and garlic' },
  { day: 15, name: 'Тефтели в томатном соусе, рис',     prompt: 'Professional studio food photography of meatballs in tomato sauce on rice' },
  { day: 16, name: 'Куриные наггетсы, картофель фри',   prompt: 'Professional studio food photography of crispy chicken nuggets with french fries' },
  { day: 17, name: 'Говядина по-строгановски, макароны', prompt: 'Professional studio food photography of beef stroganoff pasta' },
  { day: 18, name: 'Рыбные котлеты с пюре',             prompt: 'Professional studio food photography of golden fish cakes with mashed potatoes' },
  { day: 19, name: 'Манты с мясом',                     prompt: 'Professional studio food photography of steamed Uzbek manti dumplings with herbs' },
  { day: 20, name: 'Шашлык куриный, овощи гриль',       prompt: 'Professional studio food photography of chicken shashlyk skewers with grilled vegetables' },
  { day: 21, name: 'Долма, отварной картофель',         prompt: 'Professional studio food photography of stuffed grape leaves dolma with potatoes' },
  { day: 22, name: 'Азу по-татарски с картофелем',      prompt: 'Professional studio food photography of Tatar beef stew with pickles and potatoes' },
];

// ---------- SVG-генератор (плейсхолдер) ----------
const FOOD_EMOJIS = ['🥩','🍗','🥘','🍟','🐟','🍚','🥟','🍜','🥙','🧆','🍝','🥬'];

function generateSvgPlaceholder(day, name) {
  const emoji = FOOD_EMOJIS[(day - 1) % FOOD_EMOJIS.length];
  const hue = ((day - 1) * 25 + 20) % 360;
  const bg1 = `hsl(${hue}, 65%, 92%)`;
  const bg2 = `hsl(${hue + 20}, 60%, 85%)`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bg-${day}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg1}"/>
      <stop offset="100%" style="stop-color:${bg2}"/>
    </linearGradient>
    <filter id="shadow-${day}">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="400" height="300" rx="16" fill="url(#bg-${day})"/>
  <rect x="20" y="20" width="360" height="200" rx="12" fill="white" fill-opacity="0.5"/>
  <circle cx="200" cy="120" r="55" fill="white" opacity="0.9" filter="url(#shadow-${day})"/>
  <text x="200" y="140" text-anchor="middle" font-size="48" dominant-baseline="middle">${emoji}</text>
  <text x="200" y="260" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#1f2937">${name}</text>
  <text x="200" y="282" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280">День ${day}</text>
</svg>`;
}

function generateSvg(dish) {
  return generateSvgPlaceholder(dish.day, dish.name);
}

// ---------- Gemini API ----------
async function tryGeminiApi(dish) {
  const models = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
  ];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: dish.prompt }] }],
      generationConfig: { responseModalities: ['Text', 'Image'] },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find(p => p.inlineData);

      if (imgPart?.inlineData?.data) {
        const buffer = Buffer.from(imgPart.inlineData.data, 'base64');
        return buffer;
      }
    } catch {}
  }
  return null;
}

// ---------- Сохранение ----------
function saveImage(day, buffer) {
  const filePath = resolve(OUTPUT_DIR, `day-${day}.jpg`);
  writeFileSync(filePath, buffer);
  return buffer.length;
}

async function main() {
  console.log('🍽️  Lunchistan — Генерация изображений блюд');
  console.log(`📁 Папка: ${OUTPUT_DIR}\n`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const hasKey = !!API_KEY;
  let apiSuccess = 0;
  let svgGenerated = 0;

  for (const dish of DISHES) {
    process.stdout.write(`[${dish.day}/${DISHES.length}] ${dish.name}... `);

    let generated = false;

    // Пробуем Gemini API, если есть ключ
    if (hasKey) {
      const imgBuffer = await tryGeminiApi(dish);
      if (imgBuffer) {
        const bytes = saveImage(dish.day, imgBuffer);
        console.log(`✅ ${Math.round(bytes / 1024)}KB (Gemini AI)`);
        apiSuccess++;
        generated = true;
      }
    }

    // Fallback на SVG
    if (!generated) {
      const svg = generateSvg(dish);
      const buffer = Buffer.from(svg);
      const filePath = resolve(OUTPUT_DIR, `day-${dish.day}.svg`);
      writeFileSync(filePath, buffer);
      // Также создаём SVG как JPG-заглушку (на случай если brauser откроет)
      // Сохраняем SVG как основной файл
      console.log(`✅ SVG`);
      svgGenerated++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n📊 Итог:`);
  if (hasKey) console.log(`   Gemini AI: ${apiSuccess}/22`);
  console.log(`   SVG placeholders: ${svgGenerated}/22`);
  console.log(`   Всего файлов: ${apiSuccess + svgGenerated}/22`);

  // Если хотя бы SVG сгенерированы — успех
  if (svgGenerated > 0) {
    console.log('\n⚠️  Gemini API недоступен. Сгенерированы SVG-плейсхолдеры.');
    console.log('   Чтобы получить реальные фото, настройте доступ к Gemini API и запустите снова.');
  }
}

main().catch(err => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
