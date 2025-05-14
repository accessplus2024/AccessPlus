<script setup>
	import { onMounted } from 'vue';
	import { gsap } from 'gsap';

	onMounted(() => {
		// GSAP Animations
		gsap.from('header h1', {
			duration: 1.5,
			y: -50,
			opacity: 0,
			ease: 'power3.out',
		});

		gsap.from('header p', {
			duration: 1.5,
			y: 50,
			opacity: 0,
			ease: 'power3.out',
			delay: 0.5,
		});

		gsap.from('header a', {
			duration: 1.5,
			y: 50,
			opacity: 0,
			ease: 'power3.out',
			delay: 1,
		});
	});
</script>

<template>
	<header
		class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
		style="background-image: url('/images/Fundo.png')">
		<div class="container mx-auto px-6 flex flex-col items-center">
			<!-- Navbar -->
			<Navbar transparent="true" />
			<!-- Heading Content -->
			<div
				class="md:text-left text-center flex flex-col items-center md:items-start w-full max-w-4xl">
				<h1
					class="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-none text-white">
					Procurando <br />
					<span class="block">por oportunidades?</span>
				</h1>
				<p class="text-base sm:text-lg mb-6 max-w-md text-white">
					Access+ é a primeira plataforma gratuita do país focada em trazer
					oportunidades educacionais atualizadas para jovens.
				</p>
				<a
					href="/oportunidades"
					class="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300"
					>Ver tudo</a
				>
			</div>
		</div>
	</header>
</template>
