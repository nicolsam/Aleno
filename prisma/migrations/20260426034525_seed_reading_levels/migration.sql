-- Seed reading levels
INSERT INTO "reading_levels" ("id", "code", "name", "order", "description")
VALUES 
  (gen_random_uuid(), 'DNI', 'Does Not Identify', 1, 'Student does not identify letters'),
  (gen_random_uuid(), 'LO', 'Letters Only', 2, 'Student recognizes letters only'),
  (gen_random_uuid(), 'SO', 'Syllables Only', 3, 'Student reads syllables only'),
  (gen_random_uuid(), 'RW', 'Reads Words', 4, 'Student reads simple words'),
  (gen_random_uuid(), 'RS', 'Reads Sentences', 5, 'Student reads sentences'),
  (gen_random_uuid(), 'RTS', 'Reads Text Syllabically', 6, 'Student reads text syllabically'),
  (gen_random_uuid(), 'RTF', 'Reads Text Fluently', 7, 'Student reads text fluently')
ON CONFLICT ("code") DO NOTHING;