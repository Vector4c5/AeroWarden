import Header from "@/Componets/common/Header";
import { AIRCRAFT_REPORT_LOGO_SRC } from "@/lib/aircraftReportConfig";

const ABOUT_SECTIONS = [
  {
    title: "Nuestra misión",
    description:
      "En AeroWarden creemos que la gestión aeronáutica puede ser más eficiente, organizada y accesible mediante el uso de herramientas digitales. Nuestro objetivo es ayudar a hangares, talleres y organizaciones aeronáuticas a optimizar sus procesos operativos, facilitando el seguimiento de aeronaves, la administración de trabajos y la generación de reportes en una sola plataforma.",
  },
  {
    title: "Nuestra visión",
    description:
      "Buscamos convertirnos en una herramienta de referencia para la gestión digital de hangares aeronáuticos, contribuyendo a una industria más moderna, eficiente y preparada para los desafíos tecnológicos del futuro.",
  },
  {
    title: "¿Por qué AeroWarden?",
    description:
      "La administración de operaciones aeronáuticas suele depender de procesos manuales, documentos dispersos y registros difíciles de consultar. AeroWarden nace como una solución para centralizar la información y proporcionar una visión clara del estado de las aeronaves, los trabajos realizados y las actividades pendientes, mejorando la trazabilidad y el control operativo.",
  },
];

export default function Conocenos() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <div className="relative z-10">
        <Header />

        <main className="w-full">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-10 sm:gap-12 sm:px-6 sm:py-14 lg:gap-16 lg:py-16">
            <div className="w-full rounded-2xl border-b-white bg-white p-2 text-center text-2xl font-bold shadow-lg sm:w-7/12 sm:p-4 sm:text-3xl lg:p-6 lg:text-3xl">
              <h2 className="text-black">¿Quiénes somos?</h2>
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-5 sm:w-9/12">
              {ABOUT_SECTIONS.map((section) => (
                <article
                  key={section.title}
                  className="flex w-full min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:gap-4 sm:p-6"
                >
                  <h3 className="text-center text-lg font-semibold text-slate-900 sm:text-xl">
                    {section.title}
                  </h3>
                  <p className="text-xl text-justify leading-6 text-slate-600 sm:text-base sm:leading-7">
                    {section.description}
                  </p>
                </article>
              ))}
            </div>

            <section className="flex w-full flex-col items-center rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-lg sm:w-8/12 sm:p-8 lg:p-10">
              <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                ¿Cómo contactarnos?
              </h2>

              <p className="max-w-2xl text-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                Si tienes alguna duda, sugerencia o comentario, escríbenos en:
              </p>

              <div className="mt-6 flex h-auto w-40 items-center justify-center sm:mt-8">
                <img
                  src={AIRCRAFT_REPORT_LOGO_SRC}
                  alt="Logo AeroWarden"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <p className="break-all text-xl">
                <strong>aerowarden@gmail.com</strong>
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
