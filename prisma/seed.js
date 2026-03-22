const path = require("path");
require(path.join(__dirname, "../scripts/prisma-normalize-env.cjs"));
const bcrypt = require("bcryptjs");
const {
  PrismaClient,
  RolProfesional,
  RolApp,
} = require(path.join(__dirname, "../src/generated/prisma"));

const prisma = new PrismaClient();

async function main() {
  const socios = ["Santiago Acosta", "Valeria Nunez"];
  for (const nombre of socios) {
    await prisma.socio.upsert({
      where: { id: `seed-socio-${nombre.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `seed-socio-${nombre.toLowerCase().replace(/\s+/g, "-")}`,
        nombre,
      },
    });
  }

  const profesionales = [
    {
      id: "seed-profesional-lucia",
      nombre: "Lucia Fernandez",
      profesion: "Escribana",
      funcion: "Responsable de protocolos",
      rol: RolProfesional.ESCRIBANO,
    },
    {
      id: "seed-profesional-martin",
      nombre: "Martin Silva",
      profesion: "Abogado",
      funcion: "Patrocinio legal",
      rol: RolProfesional.ABOGADO,
    },
    {
      id: "seed-profesional-carolina",
      nombre: "Carolina Diaz",
      profesion: "Procuradora",
      funcion: "Gestion de expedientes",
      rol: RolProfesional.PROCURADOR,
    },
  ];

  for (const profesional of profesionales) {
    await prisma.profesional.upsert({
      where: { id: profesional.id },
      update: {},
      create: profesional,
    });
  }

  const asuntos = ["Compraventa", "Sucesion", "Arrendamiento"];
  for (const nombre of asuntos) {
    await prisma.asuntoCatalogo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  // Misma clave que src/lib/auth-inicial.ts (CLAVE_ADMIN_INICIAL)
  const passwordHash = await bcrypt.hash("Admin1234.v1", 10);
  await prisma.usuario.upsert({
    where: { usuario: "admin" },
    update: {
      passwordHash,
      nombre: "Administrador",
      rol: RolApp.ADMIN,
      activo: true,
    },
    create: {
      usuario: "admin",
      nombre: "Administrador",
      passwordHash,
      rol: RolApp.ADMIN,
      activo: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
