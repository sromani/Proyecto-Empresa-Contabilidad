-- AlterTable
ALTER TABLE "Asunto" ADD COLUMN "colaboradorACargo2Id" TEXT;

-- AddForeignKey
ALTER TABLE "Asunto" ADD CONSTRAINT "Asunto_colaboradorACargo2Id_fkey" FOREIGN KEY ("colaboradorACargo2Id") REFERENCES "Profesional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
