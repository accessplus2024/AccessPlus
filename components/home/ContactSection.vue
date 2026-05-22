<script setup>
	import { Linkedin, Instagram, Youtube } from '@iconoir/vue';
	import ContactForm from './ContactForm.vue';

	const contacts = [
		{
			icon: Linkedin,
			label: 'LinkedIn',
			link: 'https://www.linkedin.com/company/accesspluseducation/posts/?feedView=all',
		},
		{
			icon: Instagram,
			label: 'Instagram',
			link: 'https://www.instagram.com/accessplusoficial/',
		},
		{
			icon: Youtube,
			label: 'YouTube',
			link: 'https://www.youtube.com/@AccessPlusOficial',
		},
	];
</script>

<template>
	<section
		class="max-w-6xl mx-auto my-16 px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Contact Information -->
		<div data-aos="fade-right" class="p-8 bg-surface rounded-lg">
			<h2 class="font-display text-4xl font-bold leading-tight text-text mb-6">
				Entre em contato
			</h2>
			<p class="font-body text-base font-light leading-6 text-text/80 mb-8">
				Nós do Access+ estamos sempre prontos para ouvir você! Se tiver dúvidas,
				sugestões ou quiser saber mais sobre o projeto, entre em contato
				conosco. Estamos aqui para ajudar e colaborar na construção de um futuro
				com mais oportunidades para todos.
			</p>
			<div class="space-y-4">
				<!-- Contact Information Sections -->
				<div
					v-for="(contact, index) in contacts"
					:key="index"
					class="flex items-center space-x-4 bg-bg p-4 rounded-lg border border-text/10">
					<div
						class="bg-primary/10 contact-icon rounded-full p-3 flex-shrink-0">
						<component class="text-primary" :is="contact.icon" />
					</div>
					<a class="text-decoration-none flex-grow" :href="contact.link">
						<div>
							<p class="font-body text-sm font-bold text-text">{{ contact.label }}</p>
							<p v-if="contact.info" class="font-body text-xs text-text/60">
								{{ contact.info }}
							</p>
						</div>
					</a>
				</div>
			</div>
		</div>

		<!-- Contact Form -->
		<ContactForm data-aos="fade-left" />
	</section>
</template>
