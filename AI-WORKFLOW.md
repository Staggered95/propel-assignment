# AI Integration & Development Workflow

## 1. How I Actually Worked
The development process was heavily iterative, functioning essentially as pair-programming. 

## 2. Tools Utilized
* **Google AI Pro (Gemini):** Used as the primary copilot for architectural sparring, debugging.
* **Groq API (Llama 3):** To power the "AI Dispatch Brief" feature for the operators.

## 3. The Delegation Line
**What I delegated wholesale:** 
* Boilerplate Express.js routing structures.
* Complex SQL schema initializations (the exact syntax for the `init.sql` Adjacency List).

**What I wrote/controlled manually:**
* The core fault localization algorithm (`localizationService.js`).
* The architectural decisions regarding state management (e.g., deciding to use an in-memory JS Map instead of a database-heavy approach).
* The dual-file Docker Compose strategy for the final deployment.



## 4. Where the AI Failed
Working with AI requires high skepticism. Here are three concrete instances where the model confidently provided the wrong approach, and how I caught it:

* **The Recursive DDoS Trap:** I initially asked how to traverse the tree of poles. The AI confidently suggested using PostgreSQL `WITH RECURSIVE` Common Table Expressions (CTEs). A recursive CTE firing for every dropped packet would have instantly maxed out CPU and crashed the database. Implemented an In-Memory JavaScript Map that resolves it much faster.
* **The BigInt Type Coercion:** When building the Noise Filter, the AI wrote standard logic checking `if (dark_poles === 1)`. During manual testing, isolated single-pole faults kept generating massive tickets instead of being ignored. I had to debug the backend and discovered that the PostgreSQL `pg` driver returns `COUNT()` aggregates as Strings, causing ` "1" === 1` to fail silently. I had to correct the AI's code by wrapping it in `parseInt()`.

## 5. AI-Generated Code Estimate
Roughly **65%** of the final codebase is AI-generated. 

## 6. Best Prompts / Session Excerpts
The most productive interactions came from forcing the AI to confront edge cases rather than asking it to write code. 

**Prompt Excerpt 1: Forcing the Topology Constraint**
> "Suppose a pole goes dark. Possible reasons could be that the pole before it went dark, which means we found the problem. Or it could be that the transformer went dark, which means all behind this current pole would also have gone dark... but then comes the 60% disjoint (in terms of available data) poles. Even if we tried to degrade to a less precise answer, we wouldn't know because we wouldn't have the data about neighboring poles... how do we group these?"


**Prompt Excerpt 2: Addressing Scale**
> "Currently simulatorcontrols is calling an api endpoint several times for the batch processing. It looks like batch but it's just a series of many single API calls... overhead would slow down the software a lot. We need the endpoint to be able to accept single as well as a batch (probably JSON) of the data and keep processing... it should be quick. Remember that constraint they gave?"
