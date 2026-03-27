/**
 * Carga idempotente del listado RSM People (27 personas) en Socios y Equipo.
 * Ejecutar: npm run prisma:seed:rsm
 * (requiere DATABASE_URL y migraciones aplicadas)
 */
const path = require("path");
require(path.join(__dirname, "../scripts/prisma-normalize-env.cjs"));
const {
  PrismaClient,
  GrupoProfesional,
  PuestoProfesional,
} = require(path.join(__dirname, "../src/generated/prisma"));

const prisma = new PrismaClient();

function slugId(partes) {
  return partes
    .join("-")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const RSM_SOCIOS = [
  {
    id: `rsm-socio-${slugId(["ana", "ines", "montaldo"])}`,
    nombre: "Ana Inés Montaldo",
    funcion: "RSM PY & RSM UY Managing Partner",
  },
  {
    id: `rsm-socio-${slugId(["gabriela", "montaldo"])}`,
    nombre: "Gabriela Montaldo",
    funcion: "Socia de People & Culture",
  },
  {
    id: `rsm-socio-${slugId(["javier", "elenberg"])}`,
    nombre: "Javier Elenberg",
    funcion: "Socio de Finanzas Corporativas",
  },
  {
    id: `rsm-socio-${slugId(["lucia", "gutfraind"])}`,
    nombre: "Lucía Gutfraind",
    funcion: "Socia de BPO",
  },
  {
    id: `rsm-socio-${slugId(["claudia", "piano"])}`,
    nombre: "Claudia Piano",
    funcion: "Socia de Auditoria",
  },
  {
    id: `rsm-socio-${slugId(["bernardo", "vitale"])}`,
    nombre: "Bernardo Vitale",
    funcion: "Socio de Consultoria TI",
  },
  {
    id: `rsm-socio-${slugId(["magali", "campos"])}`,
    nombre: "Magali Campos",
    funcion: "Socia de RSM UY & RSM PY",
  },
];

const RSM_PROFESIONALES = [
  {
    id: `rsm-prof-${slugId(["andres", "saldana", "dir"])}`,
    nombre: "Andrés Saldaña",
    funcion: "Director de Auditoria",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.DIRECTOR,
  },
  {
    id: `rsm-prof-${slugId(["camila", "betancor", "dir"])}`,
    nombre: "Camila Betancor",
    funcion: "Directora de BPO",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.DIRECTOR,
  },
  {
    id: `rsm-prof-${slugId(["camila", "gonzalez", "dir"])}`,
    nombre: "Camila Gonzalez",
    funcion: "Directora de Auditoria",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.DIRECTOR,
  },
  {
    id: `rsm-prof-${slugId(["claudia", "cerrutti", "dir"])}`,
    nombre: "Claudia Cerrutti",
    funcion: "Directora de impuestos",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.DIRECTOR,
  },
  {
    id: `rsm-prof-${slugId(["maria", "ines", "pineiro", "dir"])}`,
    nombre: "María Inés Piñeiro",
    funcion: "Directora de BPO",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.DIRECTOR,
  },
  {
    id: `rsm-prof-${slugId(["soledad", "pasini", "dir"])}`,
    nombre: "Soledad Pasini",
    funcion: "Directora de Consultoria & Riesgos",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.DIRECTOR,
  },
  {
    id: `rsm-prof-${slugId(["deicy", "olivera", "ger"])}`,
    nombre: "Deicy Olivera",
    funcion: "Gerente de Impuestos",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["diego", "spaolonzi", "ger"])}`,
    nombre: "Diego Spaolonzi",
    funcion: "Gerente de BPO — Zonamerica",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["giovanna", "montero", "ger"])}`,
    nombre: "Giovanna Montero",
    funcion: "Gerente de BPO",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["natalia", "mendez", "ger"])}`,
    nombre: "Natalia Méndez",
    funcion: "Gerente de BPO — Zonamerica",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["marianne", "eichin", "ger"])}`,
    nombre: "Marianne Eichin",
    funcion: "Gerente de BPO",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["mariana", "rodriguez", "ger"])}`,
    nombre: "Mariana Rodriguez",
    funcion: "Gerente de Impuestos",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["noelia", "silveira", "ger"])}`,
    nombre: "Noelia Silveira",
    funcion: "Gerente de BPO",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["yanina", "bentancor", "ger"])}`,
    nombre: "Yanina Bentancor",
    funcion: "Gerente de BPO",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["adriana", "bremermann", "ger"])}`,
    nombre: "Adriana Bremermann",
    funcion: "Gerente de BPO",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["adriana", "puletto", "ger"])}`,
    nombre: "Adriana Puletto",
    funcion: "Gerente de Auditoria",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["fiorella", "silveira", "ger"])}`,
    nombre: "Fiorella Silveira",
    funcion: "Gerente de Auditoria",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["gonzalo", "correa", "ger"])}`,
    nombre: "Gonzalo Correa",
    funcion: "Gerente de Auditoria",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["patricia", "alzugaray", "ger"])}`,
    nombre: "Patricia Alzugaray",
    funcion: "Gerente de Auditoria",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
  {
    id: `rsm-prof-${slugId(["natalia", "tassino", "ger"])}`,
    nombre: "Natalia Tassino",
    funcion: "Gerente de People&Culture",
    grupo: GrupoProfesional.DIRECCION,
    puesto: PuestoProfesional.GERENTE,
  },
];

async function main() {
  for (const row of RSM_SOCIOS) {
    await prisma.socio.upsert({
      where: { id: row.id },
      update: {
        nombre: row.nombre,
        funcion: row.funcion,
        profesion: row.profesion ?? "",
      },
      create: {
        id: row.id,
        nombre: row.nombre,
        funcion: row.funcion,
        profesion: row.profesion ?? "",
      },
    });
  }

  for (const row of RSM_PROFESIONALES) {
    await prisma.profesional.upsert({
      where: { id: row.id },
      update: {
        nombre: row.nombre,
        funcion: row.funcion,
        profesion: "",
        grupo: row.grupo,
        puesto: row.puesto,
      },
      create: {
        id: row.id,
        nombre: row.nombre,
        funcion: row.funcion,
        profesion: "",
        grupo: row.grupo,
        puesto: row.puesto,
      },
    });
  }

  console.log(
    `RSM People: ${RSM_SOCIOS.length} socios + ${RSM_PROFESIONALES.length} equipo = ${RSM_SOCIOS.length + RSM_PROFESIONALES.length} registros (upsert).`,
  );
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
