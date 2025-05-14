<script setup>
	defineProps({
		category: {
			type: String,
			required: true,
		},
		icon: {
			type: String,
			required: true,
		},
	});
</script>

<template>
	<div
		:href="`/oportunidades?categoria=${category}`"
		class="bg-gray-100 rounded-lg flex items-center justify-start p-3 md:p-6">
		<div class="flex items-center">
			<img :src="`./images/i-${icon}.svg`" alt="" class="w-8 h-8" />
			<!-- Aumentei de w-6 h-6 para w-8 h-8 -->
		</div>
		<div class="w-px h-8 bg-gray-300 mx-4"></div>
		<!-- Adicionei mx-4 para espaçamento e aumentei altura para h-8 -->
		<span class="text-sm font-medium text-black">{{ category }}</span>
	</div>
</template>
