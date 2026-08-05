# AI Integration & Development Workflow

## 1. How I Actually Worked
The development process was heavily iterative, functioning essentially as pair-programming. Rather than asking for whole modules to be written at once, I used AI as an architectural sounding board. I would define the exact constraints of the physical grid (e.g., the 40/60 topology split) and use the AI to stress-test my proposed data structures before writing the code. Once an approach was validated, I generated the boilerplate and then manually wired the strict business logic to ensure it adhered to the assignment's physics constraints.

## 2. Tools Utilized
* **Google AI Pro (Gemini):** Used as the primary copilot for architectural sparring, debugging complex PostgreSQL data types, and generating the baseline Docker Compose configurations.
* **HARPA AI:** Utilized for rapid documentation lookups and quick web summaries while keeping my browser workflow consolidated.
* **Groq API (Llama 3):** Integrated directly into the application codebase to power the "AI Dispatch Brief" feature for the operators.

## 3. The Delegation Line
**What I delegated wholesale:** 
* Boilerplate Express.js routing structures.
* Standard React component scaffolding (Tailwind setups, Leaflet map initializations).
* Complex SQL schema initializations (the exact syntax for the `init.sql` Adjacency List).
* Initial `docker-compose.yml` boilerplate, building on my past experience deploying containerized platforms.

**What I wrote/controlled manually:**
* The core fault localization algorithm (`localizationService.js`).
* The data ingestion flow and debouncing logic (`ticketService.js`).
* The architectural decisions regarding state management (e.g., deciding to use an in-memory JS Map instead of a database-heavy approach).
* The dual-file Docker Compose strategy for the final deployment.

**Why I drew the line there:** I delegate syntax, but I never delegate architecture. If the AI writes a bad UI component, the app looks ugly; if the AI hallucinates a grid routing algorithm, the entire localization system fails. The strict constraints of this assignment required complete manual control over how data moved through the system.

## 4. Where the AI Failed
Working with AI requires high skepticism. Here are three concrete instances where the model confidently provided the wrong approach, and how I caught it:

* **The Recursive DDoS Trap:** I initially asked how to traverse the tree of poles. The AI confidently suggested using PostgreSQL `WITH RECURSIVE` Common Table Expressions (CTEs). I caught the flaw by dry-running the logic against the "Thundering Herd" constraint (thousands of simultaneous offline signals). A recursive CTE firing for every dropped packet would have instantly maxed out CPU and crashed the database. I threw the AI's SQL away and manually implemented an In-Memory JavaScript Map that resolves in 0.001ms.
* **The ORM Race Condition:** For the dummy data ingestion, the AI suggested utilizing Prisma. While standard practice, I rejected it because I knew from previous deployments that ORMs frequently trigger race conditions in Docker, attempting to run migrations before the PostgreSQL container is fully ready to accept connections. I forced the architecture back to a native `init.sql` script.
* **The BigInt Type Coercion:** When building the Noise Filter, the AI wrote standard logic checking `if (dark_poles === 1)`. During manual testing, isolated single-pole faults kept generating massive tickets instead of being ignored. I had to debug the backend and discovered that the PostgreSQL `pg` driver returns `COUNT()` aggregates as Strings (to prevent BigInt precision loss), causing ` "1" === 1` to fail silently. I had to correct the AI's code by wrapping it in `parseInt()`.

## 5. AI-Generated Code Estimate
Roughly **65%** of the final codebase is AI-generated. This is heavily skewed toward UI scaffolding, CSS classes, basic API route boilerplate, and Docker configurations. The core localization logic, debouncing mechanics, and architectural wiring are predominantly manual.

## 6. Best Prompts / Session Excerpts
The most productive interactions came from forcing the AI to confront edge cases rather than asking it to write code. 

**Prompt Excerpt 1: Forcing the Topology Constraint**
> "Suppose a pole goes dark. Possible reasons could be that the pole before it went dark, which means we found the problem. Or it could be that the transformer went dark, which means all behind this current pole would also have gone dark... but then comes the 60% disjoint (in terms of available data) poles. Even if we tried to degrade to a less precise answer, we wouldn't know because we wouldn't have the data about neighboring poles... how do we group these?"
*(This prompted the breakthrough to treat the 60% as binary CLUSTERS rather than attempting to guess wild tree structures.)*

**Prompt Excerpt 2: Addressing Scale**
> "Currently simulatorcontrols is calling an api endpoint several times for the batch processing. It looks like batch but it's just a series of many single API calls... overhead would slow down the software a lot. We need the endpoint to be able to accept single as well as a batch (probably JSON) of the data and keep processing... it should be quick. Remember that constraint they gave?"
*(This forced the architecture shift to returning a `202 Accepted` and chunking the array processing in the background, saving the event loop.)*