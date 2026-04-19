import { component$, useVisibleTask$, useStore } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import Petrinet from "../components/petrinet/petrinet";

export default component$(() => {
  const cursorStore = useStore({ x: 0, y: 0 });

  useVisibleTask$(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorStore.x = e.clientX;
      cursorStore.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  });

  return (
    <div class="magnetic-target">
      <div 
        id="custom-cursor" 
        style={{ 
          transform: `translate(${cursorStore.x - 6}px, ${cursorStore.y - 6}px)` 
        }} 
      />

      <section class="grid-container">
        {/* HERO SECTION */}
        <header style={{ gridColumn: '1 / span 12', marginTop: '4rem', marginBottom: '6rem' }}>
          <div class="metadata reveal reveal-1">Foundations // Discrete Event Systems // v1.0</div>
          <h1 class="reveal reveal-2">
            The Petri <br />
            <span class="editorial" style={{ textTransform: 'none', color: 'var(--color-riso-pink)' }}>
              Fundamentals
            </span>
          </h1>
          <p class="editorial reveal reveal-3" style={{ fontSize: '1.5rem', marginTop: '2rem', maxWidth: '600px' }}>
            A systematic introduction to the grammar of concurrency and the logic of distributed state.
          </p>
        </header>

        {/* SECTION 1: THE ANATOMY */}
        <div style={{ gridColumn: '1 / span 4', borderTop: '2px solid var(--color-black)', paddingTop: '1rem' }} class="reveal">
          <span class="metadata">Basic Concepts // 01</span>
          <h2 style={{ fontSize: '3rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>The Anatomy</h2>
        </div>
        <div style={{ gridColumn: '5 / span 8', marginTop: '3rem' }} class="reveal">
          <p class="editorial" style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            A Petri net consists of three primitive types: <span class="metadata" style={{color: 'var(--color-riso-pink)'}}>Places</span>, 
            <span class="metadata" style={{color: 'var(--color-deep-blue)'}}>Transitions</span>, and directed <span class="metadata">Arcs</span>. 
            Places represent potential states; Transitions represent events that change those states.
          </p>
          <Petrinet 
            label="Example.01 // Primitive.Structure"
            height="300px"
            initialPlaces={[{ id: "p1", name: "Place A", tokens: 1, x: 150, y: 150 }]}
            initialTransitions={[{ id: "t1", name: "Transition 1", x: 450, y: 150 }]}
            initialArcs={[{ from: "p1", to: "t1" }]}
          />
        </div>

        {/* SECTION 2: THE STATE */}
        <div style={{ gridColumn: '1 / span 4', borderTop: '2px solid var(--color-black)', paddingTop: '1rem', marginTop: '6rem' }}>
          <span class="metadata">Basic Concepts // 02</span>
          <h2 style={{ fontSize: '3rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>The State</h2>
        </div>
        <div style={{ gridColumn: '5 / span 8', marginTop: '9rem' }}>
          <p class="editorial" style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            The current distribution of <span class="metadata" style={{color: 'var(--color-riso-pink)'}}>Tokens</span> across places is called the <strong>Marking</strong>. 
            The marking defines the entire state of the system at any given moment.
          </p>
          <Petrinet 
            label="Example.02 // System.Marking"
            height="300px"
            initialPlaces={[
              { id: "p1", name: "Resource", tokens: 3, x: 150, y: 150 },
              { id: "p2", name: "Idle", tokens: 1, x: 450, y: 150 },
            ]}
            initialTransitions={[]}
            initialArcs={[]}
          />
        </div>

        {/* SECTION 3: THE DYNAMICS */}
        <div style={{ gridColumn: '1 / span 4', borderTop: '2px solid var(--color-black)', paddingTop: '1rem', marginTop: '6rem' }}>
          <span class="metadata">Basic Concepts // 03</span>
          <h2 style={{ fontSize: '3rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>The Dynamics</h2>
        </div>
        <div style={{ gridColumn: '5 / span 8', marginTop: '9rem' }}>
          <p class="editorial" style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            A transition is <strong>Enabled</strong> if its input places have sufficient tokens. 
            Firing an enabled transition consumes tokens from inputs and produces tokens for outputs, moving the system to a new marking.
          </p>
          <Petrinet 
            label="Example.03 // Firing.Rule"
            height="300px"
            initialPlaces={[
              { id: "p1", name: "Input", tokens: 2, x: 100, y: 150 },
              { id: "p2", name: "Output", tokens: 0, x: 500, y: 150 },
            ]}
            initialTransitions={[{ id: "t1", name: "Process", x: 300, y: 150 }]}
            initialArcs={[{ from: "p1", to: "t1" }, { from: "t1", to: "p2" }]}
          />
        </div>

        {/* SECTION 4: BEHAVIORAL PATTERNS */}
        <div style={{ gridColumn: '1 / span 4', borderTop: '2px solid var(--color-black)', paddingTop: '1rem', marginTop: '6rem' }}>
          <span class="metadata">Basic Concepts // 04</span>
          <h2 style={{ fontSize: '3rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>Patterns</h2>
        </div>
        <div style={{ gridColumn: '5 / span 8', marginTop: '9rem' }}>
          <p class="editorial" style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            Beyond single steps, we observe fundamental patterns: <span class="metadata">Conflict</span> (choice between events) and 
            <span class="metadata">Concurrency</span> (independent events occurring in parallel).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <Petrinet 
              label="Conflict // Choice"
              height="300px"
              initialPlaces={[{ id: "p1", name: "Choice", tokens: 1, x: 300, y: 100 }]}
              initialTransitions={[
                { id: "t1", name: "Option A", x: 150, y: 220 },
                { id: "t2", name: "Option B", x: 450, y: 220 },
              ]}
              initialArcs={[{ from: "p1", to: "t1" }, { from: "p1", to: "t2" }]}
            />
            <Petrinet 
              label="Concurrency // Parallel"
              height="300px"
              initialPlaces={[
                { id: "p1", name: "Thread 1", tokens: 1, x: 150, y: 100 },
                { id: "p2", name: "Thread 2", tokens: 1, x: 450, y: 100 },
              ]}
              initialTransitions={[
                { id: "t1", name: "Run 1", x: 150, y: 220 },
                { id: "t2", name: "Run 2", x: 450, y: 220 },
              ]}
              initialArcs={[{ from: "p1", to: "t1" }, { from: "p2", to: "t2" }]}
            />
          </div>
        </div>

        {/* CASE STUDIES SECTION */}
        <div style={{ gridColumn: '1 / span 12', marginTop: '12rem', marginBottom: '4rem', borderTop: '4px solid var(--color-black)', paddingTop: '2rem' }}>
          <div class="metadata" style={{ color: 'var(--color-riso-pink)' }}>Module // 02</div>
          <h2 style={{ fontSize: '5rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>Case Studies</h2>
          <p class="editorial" style={{ fontSize: '1.5rem', marginTop: '1rem', maxWidth: '800px' }}>
            Applying discrete-event primitives to solve classical coordination problems in distributed systems.
          </p>
        </div>

        {/* CASE STUDY 1: PRODUCER-CONSUMER */}
        <div style={{ gridColumn: '1 / span 4', borderTop: '2px solid var(--color-black)', paddingTop: '1rem', marginTop: '4rem' }}>
          <span class="metadata">Case Study // 01</span>
          <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>Producer <br/> Consumer</h2>
        </div>
        <div style={{ gridColumn: '5 / span 8', marginTop: '7rem' }}>
          <p class="editorial" style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            This classic synchronization problem involves a <span class="metadata">Producer</span> generating data and a <span class="metadata">Consumer</span> processing it. 
            A shared <span class="editorial">Buffer</span> with finite capacity acts as the intermediary. 
            We use <span class="metadata">Inhibitor-like logic</span> to ensure the producer stops when the buffer is full.
          </p>
          <Petrinet 
            label="Case.01 // Bounded.Buffer.Protocol"
            height="400px"
            initialPlaces={[
              { id: "p1", name: "Source Material", tokens: 10, x: 80, y: 150 },
              { id: "p2", name: "Buffer (Max 5)", tokens: 0, x: 300, y: 150 },
              { id: "p3", name: "Consumption Log", tokens: 0, x: 520, y: 150 },
              { id: "p4", name: "Available Slots", tokens: 5, x: 300, y: 50 },
            ]}
            initialTransitions={[
              { id: "t1", name: "Produce", x: 190, y: 150 },
              { id: "t2", name: "Consume", x: 410, y: 150 },
            ]}
            initialArcs={[
              { from: "p1", to: "t1" }, 
              { from: "p4", to: "t1" }, 
              { from: "t1", to: "p2" },
              { from: "p2", to: "t2" }, 
              { from: "t2", to: "p3" },
              { from: "t2", to: "p4" },
            ]}
          />
          <div class="metadata" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--color-black)', opacity: 0.7 }}>
            [ANALYSIS]: The "Available Slots" place acts as a counter. If it reaches 0, the "Produce" transition is disabled, preventing buffer overflow. This is a <strong>Safe Marking</strong> strategy.
          </div>
        </div>

        {/* CASE STUDY 2: DINING PHILOSOPHERS */}
        <div style={{ gridColumn: '1 / span 4', borderTop: '2px solid var(--color-black)', paddingTop: '1rem', marginTop: '8rem' }}>
          <span class="metadata">Case Study // 02</span>
          <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>Dining <br/> Philosophers</h2>
        </div>
        <div style={{ gridColumn: '5 / span 8', marginTop: '11rem' }}>
          <p class="editorial" style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            A cornerstone of concurrency theory. Philosophers sit around a table, alternating between <span class="metadata">Thinking</span> and <span class="metadata">Eating</span>. 
            However, eating requires two adjacent <span class="editorial">Forks</span>. 
            This case study demonstrates the critical risk of <span class="metadata" style={{color: 'var(--color-riso-pink)'}}>Deadlock</span> when resources are held circularity.
          </p>
          <Petrinet 
            label="Case.02 // Resource.Contention.Sim"
            height="500px"
            initialPlaces={[
              { id: "p1", name: "Fork Left", tokens: 1, x: 100, y: 250 },
              { id: "p2", name: "Fork Right", tokens: 1, x: 500, y: 250 },
              { id: "p3", name: "Phil A Thinking", tokens: 1, x: 150, y: 50 },
              { id: "p4", name: "Phil B Thinking", tokens: 1, x: 450, y: 50 },
              { id: "p5", name: "Phil A Eating", tokens: 0, x: 150, y: 350 },
              { id: "p6", name: "Phil B Eating", tokens: 0, x: 450, y: 350 },
            ]}
            initialTransitions={[
              { id: "t1", name: "Phil A Take Forks", x: 150, y: 200 },
              { id: "t2", name: "Phil B Take Forks", x: 450, y: 200 },
              { id: "t3", name: "Phil A Release", x: 250, y: 350 },
              { id: "t4", name: "Phil B Release", x: 350, y: 350 },
            ]}
            initialArcs={[
              { from: "p3", to: "t1" }, { from: "p1", to: "t1" }, { from: "p2", to: "t1" }, { from: "t1", to: "p5" },
              { from: "p4", to: "t2" }, { from: "p1", to: "t2" }, { from: "p2", to: "t2" }, { from: "t2", to: "p6" },
              { from: "p5", to: "t3" }, { from: "t3", to: "p3" }, { from: "t3", to: "p1" }, { from: "t3", to: "p2" },
              { from: "p6", to: "t4" }, { from: "t4", to: "p4" }, { from: "t4", to: "p1" }, { from: "t4", to: "p2" },
            ]}
          />
          <div class="metadata" style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--color-black)', opacity: 0.7 }}>
            [ANALYSIS]: In this simplified 2-philosopher model, a deadlock is avoided because we require both forks *simultaneously* for the transition to be enabled. In more complex systems with "pick up one at a time" logic, the risk of a circular wait is significantly higher.
          </div>
        </div>

        {/* FORMALISM & ANALYSIS SECTION */}
        <div style={{ gridColumn: '1 / span 12', marginTop: '12rem', marginBottom: '4rem', borderTop: '4px solid var(--color-black)', paddingTop: '2rem' }}>
          <div class="metadata" style={{ color: 'var(--color-riso-pink)' }}>Module // 03</div>
          <h2 style={{ fontSize: '5rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>Formalism</h2>
          <p class="editorial" style={{ fontSize: '1.5rem', marginTop: '1rem', maxWidth: '800px' }}>
            Beyond visualization lies the rigid mathematical framework used for verification.
          </p>
        </div>

        <div style={{ gridColumn: '1 / span 4', borderTop: '2px solid var(--color-black)', paddingTop: '1rem', marginTop: '4rem' }}>
          <span class="metadata">Analysis // 01</span>
          <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>Incidence <br/> Matrix</h2>
        </div>
        <div style={{ gridColumn: '5 / span 8', marginTop: '7rem' }}>
          <p class="editorial" style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            A Petri net can be represented as a matrix <strong>W</strong> where each row is a place and each column is a transition. 
            The values represent the change in tokens. This allows us to use linear algebra to find <span class="metadata">Invariants</span>.
          </p>
          <div class="canvas-block" style={{ padding: '3rem', fontSize: '1.5rem', fontFamily: 'monospace', overflowX: 'auto', background: 'var(--color-white)', border: '2px solid var(--color-black)' }}>
             <table style={{ width: '100%', minWidth: '400px', textAlign: 'center', borderCollapse: 'collapse' }}>
               <thead>
                 <tr>
                   <th></th>
                   <th class="metadata" style={{ color: 'var(--color-deep-blue)', padding: '1rem' }}>T1</th>
                   <th class="metadata" style={{ color: 'var(--color-deep-blue)', padding: '1rem' }}>T2</th>
                   <th class="metadata" style={{ color: 'var(--color-deep-blue)', padding: '1rem' }}>T3</th>
                 </tr>
               </thead>
               <tbody>
                 <tr>
                   <td class="metadata" style={{ textAlign: 'left', color: 'var(--color-riso-pink)', padding: '1rem' }}>Place 1</td>
                   <td>-1</td>
                   <td>0</td>
                   <td>+1</td>
                 </tr>
                 <tr>
                   <td class="metadata" style={{ textAlign: 'left', color: 'var(--color-riso-pink)', padding: '1rem' }}>Place 2</td>
                   <td>+1</td>
                   <td>-1</td>
                   <td>0</td>
                 </tr>
                 <tr>
                   <td class="metadata" style={{ textAlign: 'left', color: 'var(--color-riso-pink)', padding: '1rem' }}>Place 3</td>
                   <td>0</td>
                   <td>+1</td>
                   <td>-1</td>
                 </tr>
               </tbody>
             </table>
          </div>
        </div>

        <div style={{ gridColumn: '1 / span 4', borderTop: '2px solid var(--color-black)', paddingTop: '1rem', marginTop: '8rem' }}>
          <span class="metadata">Analysis // 02</span>
          <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', fontWeight: 900, marginTop: '1rem' }}>Reachability <br/> Graph</h2>
        </div>
        <div style={{ gridColumn: '5 / span 8', marginTop: '11rem' }}>
          <p class="editorial" style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
            The <span class="metadata">Reachability Graph</span> maps every possible marking of the system. 
            It is the "State Space" that we traverse to prove properties like <span class="editorial">Safety</span> and <span class="editorial">Liveness</span>.
          </p>
          <div class="canvas-block" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-white)', border: '2px solid var(--color-black)' }}>
             <div class="metadata" style={{ textAlign: 'center', fontSize: '1.2rem', lineHeight: 1.5 }}>
               <span style={{ color: 'var(--color-riso-pink)' }}>[M0]</span> --T1--&gt; <span style={{ color: 'var(--color-deep-blue)' }}>[M1]</span> --T2--&gt; <span style={{ color: 'var(--color-riso-pink)' }}>[M2]</span> <br/>
               ^ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | <br/>
               +-----------------T3-----------------+
             </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{ gridColumn: '1 / span 12', marginTop: '8rem', borderTop: '1px solid var(--color-black)', paddingTop: '2rem', paddingBottom: '4rem' }}>
          <div class="grid-container" style={{ padding: 0 }}>
            <div style={{ gridColumn: '1 / span 4' }}>
               <div class="metadata" style={{ color: 'var(--color-riso-pink)' }}>Petri-Dynamics.Archive</div>
               <p class="editorial" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
                 A digital archive dedicated to the study of discrete-event systems and concurrent modeling.
               </p>
            </div>
            <div style={{ gridColumn: '5 / span 4' }}>
               <div class="metadata">Documentation</div>
               <ul class="metadata" style={{ listStyle: 'none', marginTop: '1rem', fontSize: '0.7rem' }}>
                 <li>Mathematical Foundations</li>
                 <li>State Space Analysis</li>
                 <li>Invariant Discovery</li>
               </ul>
            </div>
            <div style={{ gridColumn: '9 / span 4', textAlign: 'right' }}>
               <div class="metadata">v2026.04.19</div>
               <div class="metadata" style={{ marginTop: '1rem' }}>SYSTEM STATUS: LIVENESS_DETECTED</div>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Petri Dynamics | Discrete Event Systems",
  meta: [
    {
      name: "description",
      content: "Interactive Petri Net anthology covering mathematical modeling and distributed state.",
    },
  ],
};
