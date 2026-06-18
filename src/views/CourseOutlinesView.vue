<script setup>
const outlines = [
  {
    title: 'Contracts',
    focus: 'Formation, consideration, performance, and remedies.',
    materials: ['Reading notes', 'Cold-call cases', 'Exam attack outline'],
  },
  {
    title: 'Torts',
    focus: 'Intentional torts, negligence, strict liability, and defenses.',
    materials: ['Rule statements', 'Policy arguments', 'Practice hypos'],
  },
  {
    title: 'Civil Procedure',
    focus: 'Jurisdiction, pleading, discovery, and summary judgment.',
    materials: ['FRCP references', 'Timeline checklist', 'Professor lecture recap'],
  },
]
</script>

<template>
  <section class="content-grid">
    <article class="panel panel-wide">
      <div class="panel-header">
        <div>
          <p class="label">Course outlines</p>
          <h2>Track your materials by class.</h2>
        </div>
        <p class="supporting-copy">
          Keep each course anchored around the rules, cases, and exam prep resources you revisit
          throughout the semester.
        </p>
      </div>

      <div class="outline-list">
        <article v-for="outline in outlines" :key="outline.title" class="outline-card">
          <h3>{{ outline.title }}</h3>
          <p>{{ outline.focus }}</p>
          <ul>
            <li v-for="item in outline.materials" :key="item">{{ item }}</li>
          </ul>
        </article>
      </div>
    </article>
  </section>
</template>

<style scoped>
.content-grid {
  display: grid;
}

.panel {
  padding: 1.5rem;
  border: 1px solid #e7e5e4;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
}

.panel-wide {
  display: grid;
  gap: 1.5rem;
}

.panel-header {
  display: grid;
  gap: 1rem;
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
h3,
p,
ul {
  margin-top: 0;
}

h2 {
  margin-bottom: 0;
  font-size: 1.8rem;
}

.supporting-copy {
  max-width: 42rem;
  margin-bottom: 0;
  line-height: 1.65;
}

.outline-list {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.outline-card {
  padding: 1.25rem;
  border-radius: 1rem;
  background: #f8fafc;
}

.outline-card p {
  line-height: 1.6;
}

ul {
  padding-left: 1.2rem;
  margin-bottom: 0;
}

li + li {
  margin-top: 0.45rem;
}
</style>
