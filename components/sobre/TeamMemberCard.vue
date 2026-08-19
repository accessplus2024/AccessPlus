<script setup>
defineProps({
  name: String,
  role: String,
  location: String,
  image: String,
  color: { type: String, default: "var(--color-primary)" },
})
</script>

<template>
  <div class="member-card group">
    <!-- Anel colorido atrás de uma foto grande e quadrada (cantos arredondados -->
    <!-- no estilo dos outros cards do site, sem virar círculo). -->
    <div class="photo-wrap">
      <div class="photo-ring" :style="{ background: color }" />
      <div class="photo-frame">
        <img :src="image" :alt="name" class="photo-img" />
      </div>
    </div>

    <h3 class="font-display mt-4" style="font-size: 19px; line-height: 1.15">{{ name }}</h3>
    <span class="role-pill mt-2" :style="{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }">
      {{ role }}
    </span>
    <p class="text-ink/50 mt-2" style="font-size: 13px">{{ location }}</p>
  </div>
</template>

<style scoped>
.member-card {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 16px 24px;
  border-radius: var(--r-card);
  transition: transform .35s var(--ease);
}
.member-card:hover { transform: translateY(-6px); }

.photo-wrap {
  position: relative;
  width: 100%;
  max-width: 250px;
  aspect-ratio: 1 / 1;
}
@media (max-width: 640px) {
  .member-card { padding: 18px 10px 16px; }
  .photo-wrap { max-width: 150px; }
}
.photo-ring {
  position: absolute;
  inset: -8px;
  border-radius: 32px;
  opacity: .22;
  transition: transform .4s var(--ease), opacity .4s var(--ease);
}
.member-card:hover .photo-ring { transform: scale(1.05) rotate(4deg); opacity: .32; }

.photo-frame {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 28px;
  overflow: hidden;
  border: 4px solid var(--color-card, #fff);
  box-shadow: 0 8px 22px rgba(21, 17, 31, .14);
}
.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .5s var(--ease);
}
.member-card:hover .photo-img { transform: scale(1.06); }

.role-pill {
  display: inline-flex;
  padding: 5px 14px;
  border-radius: var(--r-pill);
  font-weight: 600;
  font-size: 12.5px;
}
</style>
