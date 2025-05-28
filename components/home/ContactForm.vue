<template>
	<div class="bg-[#3D30A2] p-8 rounded-lg shadow-md">
		<h2 class="text-2xl font-semibold leading-tight text-white mb-6">
			Mande uma Mensagem
		</h2>
		<form action="https://formspree.io/f/meoekypw" method="POST">
			<div class="mb-6">
				<label for="name" class="block text-white mb-2 text-left">Nome</label>
				<input
					type="text"
					id="name"
					name="name"
					class="w-full p-3 rounded-lg border border-purple-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black"
					placeholder="Nome" />
			</div>
			<div class="mb-6">
				<label for="email" class="block text-white mb-2 text-left"
					>E-mail</label
				>
				<input
					type="email"
					id="email"
					name="email"
					class="w-full p-3 rounded-lg border border-purple-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black"
					placeholder="E-mail" />
			</div>
			<div class="mb-6">
				<label for="message" class="block text-white mb-2 text-left"
					>Mensagem</label
				>
				<textarea
					id="message"
					name="message"
					rows="4"
					class="w-full p-3 rounded-lg border border-purple-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-black"
					placeholder="Mensagem"></textarea>
			</div>
			<button
				type="submit"
				class="bg-[#FAD87E] text-black px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300">
				Enviar
			</button>
		</form>
	</div>
</template>
