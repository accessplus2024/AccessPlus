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
		<div data-aos="fade-right" class="p-8 bg-white rounded-lg">
			<h2 class="text-4xl font-bold leading-tight text-gray-900 mb-6">
				Entre em contato
			</h2>
			<p class="text-base font-light leading-6 text-gray-800 mb-8">
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
					class="flex items-center space-x-4 bg-gray-100 p-4 rounded-lg">
					<div
						class="bg-purple-100 contact-icon rounded-full p-3 flex-shrink-0">
						<component class="text-[#3d30a2]" :is="contact.icon" />
					</div>
					<a class="text-decoration-none flex-grow" :href="contact.link">
						<div>
							<p class="text-sm font-bold text-gray-700">{{ contact.label }}</p>
							<p v-if="contact.info" class="text-xs text-gray-500">
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
