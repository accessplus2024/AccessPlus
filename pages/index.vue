<script setup>
	import { onMounted } from 'vue';
	import { gsap } from 'gsap';
	import AOS from 'aos';
	import 'aos/dist/aos.css';

	import HomeHeader from '~/components/home/header/HomeHeader.vue';
	import FeaturesSection from '~/components/home/features/FeaturesSection.vue';
	import OpportunitiesSection from '~/components/home/opportunities/OpportunitiesSection.vue';
	import NewsSection from '~/components/home/news/NewsSection.vue';
	import AboutSection from '~/components/home/about/AboutSection.vue';
	import ContactSection from '~/components/home/contact/ContactSection.vue';
	import AwardsSection from '~/components/home/awards/AwardsSection.vue';

	useHead({
		link: [
			{
				rel: 'icon',
				type: 'image/png',
				href: '/images/estrelinhas.png',
			},
		],
	});

	useHead({
		title: 'Home',
		meta: [
			{ charset: 'UTF-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
			{ hid: 'description', name: 'description', content: '' },
		],
		htmlAttrs: {
			lang: 'pt-br',
		},
	});

	onMounted(() => {
		// Initialize AOS
		AOS.init({
			duration: 1000,
			once: true,
		});
	});
</script>

<template>
	<HomeHeader />
	<FeaturesSection />
	<OpportunitiesSection />
	<NewsSection />
	<AboutSection />
	<ContactSection />
	<AwardsSection />
</template>
