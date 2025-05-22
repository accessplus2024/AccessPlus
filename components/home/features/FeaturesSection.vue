<script setup>
	import { onMounted } from 'vue';
	import { gsap } from 'gsap';
	import AOS from 'aos';

	onMounted(() => {
		gsap.from('.card', {
			duration: 1,
			y: 50,
			opacity: 0,
			stagger: 0.2,
			ease: 'power3.out',
			delay: 1.5,
		});
	});
</script>

<template>
	<div class="text-center mt-12">
		<!-- Title -->
		<h1
			class="text-2xl sm:text-3xl md:text-4xl font-bold flex flex-col gap-4 justify-center items-center text-gray-800 mb-8">
			O que você pode encontrar no &nbsp;<img
				src="/images/logo-dark.svg"
				class="h-8 sm:h-10 md:h-12" />
		</h1>

		<!-- Cards Container -->
		<div class="flex flex-wrap justify-center gap-6 px-4">
			<!-- Opp Card -->
			<div
				class="card bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-1/2 sm:w-64 h-48 flex flex-col justify-start items-start relative"
				style="background-image: url('/images/oportunidades.png')">
				<p class="text-2xl font-bold">+140</p>
				<p class="text-lg text-left">oportunidades educacionais</p>
			</div>

			<!-- Guias Card -->
			<div
				data-aos-delay="200"
				class="card bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-1/2 sm:w-64 h-48 flex flex-col justify-start items-start relative"
				style="background-image: url('/images/Guias.png')">
				<p class="text-2xl font-bold">Guias</p>
				<p class="text-lg text-left">e informações atualizadas</p>
			</div>

			<!-- Dicas Card -->
			<div
				data-aos-delay="400"
				class="card bg-cover bg-bottom md:bg-center text-white p-6 rounded-lg w-1/2 mx-auto sm:mx-0 sm:w-64 h-48 flex flex-col justify-start items-start relative"
				style="background-image: url('/images/Dicas.png')">
				<p class="text-2xl font-bold">Dicas</p>
				<p class="text-lg text-left">de premiados das mais diversas áreas</p>
			</div>
		</div>
	</div>
</template>
