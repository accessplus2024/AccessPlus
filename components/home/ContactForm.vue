<template>
	<div class="bg-primary p-8 rounded-lg shadow-md">
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
					class="w-full font-body p-3 rounded-lg border border-primary/40 focus:outline-none focus:ring-2 focus:ring-accent-green text-text bg-bg"
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
					class="w-full font-body p-3 rounded-lg border border-primary/40 focus:outline-none focus:ring-2 focus:ring-accent-green text-text bg-bg"
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
					class="w-full font-body p-3 rounded-lg border border-primary/40 focus:outline-none focus:ring-2 focus:ring-accent-green text-text bg-bg"
					placeholder="Mensagem"></textarea>
			</div>
			<button
				type="submit"
				class="font-body bg-accent-green text-[#0D0B1A] px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
				Enviar
			</button>
		</form>
	</div>
</template>
