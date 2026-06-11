import Header from "@/Componets/common/Header";

export default function conocenos() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="mb-10 text-center text-4xl font-bold text-slate-900"><strong>Conócenos</strong></h1>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">Nuestra misión</h2>
            <img
              src="/images/mision.jpg"
              className="mb-5 h-44 w-full rounded-2xl object-cover"
            />
            <p className="text-left text-slate-600 leading-8">
              En AeroWarden creemos que la gestión aeronáutica puede ser más eficiente,
              organizada y accesible mediante el uso de herramientas digitales. Nuestro
              objetivo es ayudar a hangares, talleres y organizaciones aeronáuticas a
              optimizar sus procesos operativos, facilitando el seguimiento de aeronaves,
              la administración de trabajos y la generación de reportes en una sola plataforma.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">Nuestra visión</h2>
            <img
              src="/images/vision.jpg"
              className="mb-5 h-44 w-full rounded-2xl object-cover"
            />
            <p className="text-left text-slate-600 leading-8">
              Buscamos convertirnos en una herramienta de referencia para la gestión
              digital de hangares aeronáuticos, contribuyendo a una industria más moderna,
              eficiente y preparada para los desafíos tecnológicos del futuro.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">¿Por qué AeroWarden?</h2>
            <img
              src="/images/porque.jpg"
              className="mb-5 h-44 w-full rounded-2xl object-cover"
            />
            <p className="text-left text-slate-600 leading-8">
              La administración de operaciones aeronáuticas suele depender de procesos
              manuales, documentos dispersos y registros difíciles de consultar. AeroWarden
              nace como una solución para centralizar la información y proporcionar una
              visión clara del estado de las aeronaves, los trabajos realizados y las
              actividades pendientes, mejorando la trazabilidad y el control operativo.
            </p>
          </article>
          
          <article className="md:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg text-center">
            <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">Contáctanos</h2>
            <img
              src="/images/contacto.jpg"
              className="mb-5 h-44 w-full rounded-2xl object-cover"
            />
            <p className="text-slate-600 leading-8 text-center">
              Escríbenos a <strong>aerowarden@gmail.com</strong> o llámanos al <br />
              <strong>Tel. Héctor</strong>.
            </p>
          </article>
        </div>
      </main>
    </div>
  );
}
