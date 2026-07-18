-- extracted program (userEnteredValue + numberFormat only, computed values
-- stripped), stored for future post-solve stats; null when oversized or
-- the sheet was inaccessible
ALTER TABLE submissions ADD COLUMN program TEXT;
