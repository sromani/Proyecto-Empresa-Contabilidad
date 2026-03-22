import { FichaAsunto } from "@/components/ficha-asunto";

type Props = { params: Promise<{ id: string }> };

export default async function AsuntoFichaPage(props: Props) {
  const { id } = await props.params;
  return (
    <section>
      <FichaAsunto id={id} />
    </section>
  );
}
