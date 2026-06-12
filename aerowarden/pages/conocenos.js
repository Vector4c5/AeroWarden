import Header from "@/Componets/common/Header";

export default function conocenos() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-10 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900 sm:mb-10 sm:text-4xl"><strong>Conócenos</strong></h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6">
            <h2 className="mb-4 text-center text-2xl font-bold text-slate-900 sm:text-3xl">Nuestra misión</h2>
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

          <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6">
            <h2 className="mb-4 text-center text-2xl font-bold text-slate-900 sm:text-3xl">Nuestra visión</h2>
            <img
              src="/hang-aeronave.png"
              className="mb-5 h-44 w-full rounded-2xl object-cover"
            />
            <p className="text-left text-slate-600 leading-8">
              Buscamos convertirnos en una herramienta de referencia para la gestión
              digital de hangares aeronáuticos, contribuyendo a una industria más moderna,
              eficiente y preparada para los desafíos tecnológicos del futuro.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6">
            <h2 className="mb-4 text-center text-2xl font-bold text-slate-900 sm:text-3xl">¿Por qué AeroWarden?</h2>
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
          
          <article className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-lg sm:p-6 lg:col-span-3">
            <h2 className="mb-4 text-center text-2xl font-bold text-slate-900 sm:text-3xl">Contáctanos</h2>
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
