# Research Brief: Reasoning Creativity for AI Agents

## Working Definition

Creativity is often defined as the ability to produce something original or new. For practical work, the stronger definition is novelty plus usefulness: an output should be different enough to matter and appropriate enough to solve a real problem.

This skill narrows that into "reasoning creativity":

> the disciplined production of novel, useful, testable problem framings and solutions under real constraints.

That definition matters because AI agents can easily generate novelty that is decorative, random, or overcomplicated. For technical and career growth tasks, the useful creative move is usually a better problem frame, a sharper tradeoff, a simpler architecture, an experiment, a reusable asset, or a project that compounds the user's skill.

## Human Creativity Research

### Novelty plus usefulness

Runco and Jaeger describe the standard definition of creativity as requiring both originality and effectiveness. APA's dictionary definition emphasizes original work, theories, techniques, or thoughts. Britannica frames creativity as bringing something new into existence, including a solution, method, device, object, or form. Together, these definitions reject "randomness equals creativity."

Skill implication: require both novelty and usefulness. Make the agent ask, "What is new here, and why does it help?"

### Divergent and convergent thinking

Guilford's creativity research popularized the importance of divergent production: generating many possible responses instead of rushing to one answer. Creative problem solving traditions such as Osborn-Parnes separate divergent generation from convergent selection.

Skill implication: first expand the option space, then narrow it. Do not let the first plausible answer win too early.

### Wallas's process model

Wallas proposed a four-stage creative process: preparation, incubation, illumination, and verification. Modern work should not treat this as magic. Preparation maps the problem; incubation can be simulated by stepping away from the first framing; illumination becomes candidate insight; verification tests the result.

Skill implication: for AI, simulate incubation by reframing, switching lenses, and revisiting assumptions before selecting.

### Rhodes's 4P model

Rhodes organized creativity around person, process, product, and press. "Press" means environment: incentives, audience, constraints, and social conditions.

Skill implication: do not judge an idea in isolation. Ask who it is for, what environment it lives in, and what constraints shape it.

### Amabile's componential theory

Amabile's componential theory includes domain-relevant skills, creativity-relevant processes, motivation, and environment. Creative performance improves when domain knowledge and creative methods work together.

Skill implication: a useful AI creativity skill must combine domain grounding with creativity operations. For tech growth, it should also increase the user's domain skill.

### Mednick and remote association

Mednick's associative theory connects creativity to forming useful combinations among remote ideas. Remote association is valuable when it creates a meaningful bridge, not when it merely sounds surprising.

Skill implication: use analogies from other domains, but translate them into testable solution mechanics.

### Boden's three kinds of creativity

Margaret Boden distinguishes combinational creativity, exploratory creativity, and transformational creativity. Combinational creativity joins familiar ideas. Exploratory creativity searches a conceptual space. Transformational creativity changes the rules of the space.

Skill implication: make the agent explicitly try all three:

- Combine: What two known patterns can be joined?
- Explore: What unexplored option exists inside the current constraints?
- Transform: Which constraint or assumption should change?

## AI Creativity Research

Recent studies show that large language models can perform strongly on divergent-thinking tasks, sometimes matching or exceeding average human performance on narrow tests. Other studies warn that LLM creativity can be homogeneous, sensitive to prompt design, model choice, sampling, and evaluation method.

The practical conclusion is not "AI is creative like a human." A safer conclusion is:

- LLMs can generate many candidate ideas quickly.
- They need scaffolding to avoid generic or homogeneous outputs.
- They need evaluation criteria to balance novelty and usefulness.
- They need user context and verification to become valuable.

Skill implication: use the AI as a creative reasoning engine, not as an oracle. Force multiple frames, distant associations, tradeoff scoring, and feedback loops.

## Design Principles for the Skill

1. Problem finding before solution making
   - Human creativity often starts by noticing the better problem. The skill should search for hidden bottlenecks and assumptions.

2. Divergence before convergence
   - Generate multiple solution families before selecting.

3. Reasoned novelty
   - Novel ideas must be useful, ethical, feasible, and testable.

4. Constraints as fuel
   - Limits should trigger reframing, not surrender.

5. Technical leverage
   - In tech tasks, creative work should often produce reusable code, automation, architecture, instrumentation, or learning loops.

6. Human growth
   - The output should leave the user more capable: a mental model, project ladder, feedback metric, or next challenge.

7. Verification
   - Creative ideas become real through tests, prototypes, user feedback, or measurable signals.

## Sources

- APA Dictionary of Psychology, "creativity": https://dictionary.apa.org/creativity
- APA Dictionary of Psychology, "creative thinking": https://dictionary.apa.org/creative-thinking
- Britannica, "Creativity": https://www.britannica.com/topic/creativity
- Runco, M. A., and Jaeger, G. J. "The Standard Definition of Creativity": https://www.tandfonline.com/doi/abs/10.1080/10400419.2012.650092
- Harvard Business School, Amabile componential theory summary: https://www.hbs.edu/faculty/Pages/item.aspx?num=42469
- Mednick, S. A. "The Associative Basis of the Creative Process": https://philpapers.org/rec/MEDTAB
- Creative Education Foundation, Creative Problem Solving guide: https://www.creativeeducationfoundation.org/wp-content/uploads/2015/06/CPS-Guide-6-3-web.pdf
- Boden creativity types overview in computational creativity literature: https://pmc.ncbi.nlm.nih.gov/articles/PMC4321140/
- Nature Scientific Reports, "The current state of artificial intelligence generative language models is more creative than humans on divergent thinking tasks": https://www.nature.com/articles/s41598-024-53303-w
- Nature Human Behaviour, "A large-scale comparison of divergent creativity in humans and large language models": https://www.nature.com/articles/s41562-025-02331-1
- ACL Anthology, "Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate": https://aclanthology.org/2024.emnlp-main.992
- Google Antigravity skills docs: https://antigravity.google/docs/skills?authuser=2&hl=pt
