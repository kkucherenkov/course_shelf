-- Renamed, not dropped+recreated: `quiz.modelFilename` held meaningful data
-- (a .gguf filename or, under the hosted provider per ADR-0012, a provider
-- model id like `mistralai/mistral-nemo`) — the column name was wrong, the
-- data was not.
ALTER TABLE "quiz" RENAME COLUMN "modelFilename" TO "model";
