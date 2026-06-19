<script setup>
import { computed, reactive } from 'vue'

const brief = reactive({
  caseName: '',
  facts: '',
  issue: '',
  rule: '',
  analysis: '',
  conclusion: '',
})

const sections = computed(() => [
  ['Facts', brief.facts || 'Summarize the legally significant facts.'],
  ['Issue', brief.issue || 'Frame the question the court answered.'],
  ['Rule', brief.rule || 'State the governing rule or legal standard.'],
  ['Analysis', brief.analysis || 'Capture how the court applied the rule.'],
  ['Conclusion', brief.conclusion || 'Note the disposition or takeaway.'],
])
</script>

<template>
  <section class="brief-layout">
    <article class="panel">
      <p class="label">Case brief builder</p>
      <h2>Create a reusable brief.</h2>
      <p class="supporting-copy">
        Draft each section once, then review the completed brief beside your notes.
      </p>

      <form class="brief-form">
        <label>
          Case name
          <input
            id="case-name"
            v-model.trim="brief.caseName"
            type="text"
            placeholder="Palsgraf v. Long Island Railroad Co."
          >
        </label>

        <label>
          Facts
          <textarea v-model.trim="brief.facts" rows="4" placeholder="What happened?"></textarea>
        </label>

        <label>
          Issue
          <textarea
            v-model.trim="brief.issue"
            rows="3"
            placeholder="What legal question did the court resolve?"
          ></textarea>
        </label>

        <label>
          Rule
          <textarea
            v-model.trim="brief.rule"
            rows="3"
            placeholder="What rule controlled the outcome?"
          ></textarea>
        </label>

        <label>
          Analysis
          <textarea
            v-model.trim="brief.analysis"
            rows="4"
            placeholder="How did the court reason through the issue?"
          ></textarea>
        </label>

        <label>
          Conclusion
          <textarea
            v-model.trim="brief.conclusion"
            rows="3"
            placeholder="What should you remember for class or exams?"
          ></textarea>
        </label>
      </form>
    </article>

    <article class="panel preview">
      <p class="label">Brief preview</p>
      <h2>{{ brief.caseName || 'Untitled case brief' }}</h2>

      <dl>
        <div v-for="[title, content] in sections" :key="title" class="preview-section">
          <dt>{{ title }}</dt>
          <dd>{{ content }}</dd>
        </div>
      </dl>
    </article>
  </section>
</template>

<style scoped>
.brief-layout {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.panel {
  padding: 1.5rem;
  border: 1px solid #e7e5e4;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
}

.label {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #92400e;
}

h2,
p,
dl {
  margin-top: 0;
}

.supporting-copy {
  line-height: 1.65;
}

.brief-form {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  padding: 0.85rem 0.95rem;
  border: 1px solid #d6d3d1;
  border-radius: 0.9rem;
  font: inherit;
  background: #fffdfb;
}

textarea {
  resize: vertical;
}

.preview dl {
  display: grid;
  gap: 1rem;
  margin-bottom: 0;
}

.preview-section {
  padding: 1rem;
  border-radius: 1rem;
  background: #f8fafc;
}

dt {
  margin-bottom: 0.4rem;
  font-weight: 700;
}

dd {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
