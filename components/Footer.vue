<template>
	<footer class="bg-[#A459D1] py-10 mt-12 rounded-t-3xl">
		<div
			class="max-w-5xl mx-auto px-4 sm:px-[60px] flex flex-col sm:flex-row justify-between items-start">
			<div class="flex flex-col items-start">
				<div class="flex flex-1 w-full h-full">
					<img src="/images/logo-light-footer.svg" class="mt-7" />
				</div>
				<div
					class="text-white flex items-start sm:items-center w-full mt-4 sm:mt-6">
					<span class="text-sm mr-3 sm:text-base"
						>Siga nossas redes sociais:</span
					>
					<Socials theme="dark" />
				</div>
			</div>
			<div class="text-white text-left mt-8 sm:mt-0">
				<h2 class="text-[24px] font-semibold mb-2">Navegação</h2>
				<div class="flex flex-col">
					<ul class="flex flex-col space-y-1">
						<li
							v-for="(link, index) in [
								{ text: 'Início', href: '/' },
								{ text: 'Sobre nós', href: '/sobre' },
								{ text: 'Oportunidades', href: '/oportunidades' },
							]"
							:key="index">
							<a
								:href="link.href"
								class="text-white text-[14px] hover:text-yellow-500 font-bold transition-colors duration-300 ease-in-out">
								{{ link.text }}
							</a>
						</li>
					</ul>
					<!--<ul class="flex flex-col space-y-1">
						<li
							v-for="category in [
								'Olimpíadas Científicas',
								'Programas de Intercâmbio',
								'Competições de Escrita',
								'Mentorias',
								'Bolsas de Estudo',
								'MUNs',
							]"
							:key="category">
							<a href="#" class="text-white text-[14px] hover:text-yellow-500">
								{{ category }}
							</a>
						</li> 
						<li>
							<a
								href="#"
								class="text-white text-[14px] hover:text-yellow-500 font-bold">
								Veja Tudo  
							</a>
						</li> 	
					</ul>-->
				</div>
			</div>
		</div>
	</footer>
</template>
