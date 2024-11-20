<script setup>
useHead({
    title: "Oportunidades",
    meta: [
        { charset: "UTF-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        { hid: "description", name: "description", content: "" },
    ],

    htmlAttrs: {
        lang: "pt-br",
    },
});
</script>

<template>

    <body class="bg-white text-white">
        <!-- Header Section -->
        <header class="relative bg-gradient-to-r from-purple-600 to-pink-600 pb-16 rounded-b-lg bg-cover bg-center"
            style="background-image: url('/images/oportunidades_page_header.png')">
            <div class="container mx-auto px-6 flex flex-col items-center">
                <!-- Navbar -->
                <Navbar transparent="true" />
                <!-- Heading Content -->
                <div class="text-left w-full max-w-4xl mt-12">
                    <h1 class="text-5xl mb-4 leading-none">
                        <p class="font-bold">Todas as</p>
                        <span class="block font-semibold">Oportunidades</span>
                    </h1>
                </div>
            </div>
        </header>

        <!-- Opportunity Section -->
        <main class="container mx-auto px-6 py-12">
            <!-- Label e Search bar -->
            <div class="flex flex-row items-center gap-6 mb-8">
                <div class=" bg-gray-100 p-3 rounded-lg">
                    <h4 class="text-xl font-semibold text-black">Filtre:</h4>
                </div>
                <div class="container flex ">
                    <input type="text" placeholder="Olimpíada Brasileira de Investimentos"
                        class="w-full text-black bg-gray-100 font-light p-4 rounded-lg border border-gray-300" />
                </div>
            </div>

            <!-- Opportunites -->
            <div class="flex space-x-6 gap-6">
                <!-- Filter menu -->
                <div class="w-1/4 bg-gray-100 text-black p-6 rounded-lg" style="min-width: 300px;">
                    <h2 class="text-xl font-semibold mb-4 text-black">Filtros</h2>
                    <!-- Adicione aqui os filtros de oportunidade -->
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold mb-2">Palavras-chave</h3>
                        <div>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Olimpíadas Científicas
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> MUNs
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Programas Acadêmicos
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Programas de Intercâmbios
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Bolsas de Estudo
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Competições
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Competições de Escrita
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Mentorias
                            </label>
                        </div>
                    </div>
                    <div class="mb-4">
                        <h3 class="text-lg font-semibold mb-2">Interesses</h3>
                        <div>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Meio Ambiente
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Humanas
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> STEM
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Linguagens
                            </label>
                            <label class="block">
                                <input type="checkbox" class="mr-2" /> Artes
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Main content -->
                <div class="w-3/4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <!-- Card 1 -->
                        <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <img src="https://placehold.co/400x200" alt="Image of educational opportunity"
                                class="w-full h-48 object-cover" />
                            <div class="p-6">
                                <div class="flex space-x-2 mb-4">
                                    <span
                                        class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">Categoria</span>
                                    <span class="bg-red-500 text-white text-xs px-3 py-1 rounded-full">Deadline</span>
                                    <span class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Nível</span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-800 mb-2">Nome</h3>
                                <p class="text-sm text-gray-600 mb-4">Descrição breve da oportunidade</p>
                                <a href="oportunidade" class="text-purple-600 font-semibold">Veja mais</a>
                            </div>
                        </div>
                        <!-- Card 2 -->
                        <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <img src="https://placehold.co/400x200" alt="Image of educational opportunity"
                                class="w-full h-48 object-cover" />
                            <div class="p-6">
                                <div class="flex space-x-2 mb-4">
                                    <span
                                        class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">Categoria</span>
                                    <span class="bg-red-500 text-white text-xs px-3 py-1 rounded-full">Deadline</span>
                                    <span class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Nível</span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-800 mb-2">Nome</h3>
                                <p class="text-sm text-gray-600 mb-4">Descrição breve da oportunidade</p>
                                <a href="oportunidade" class="text-purple-600 font-semibold">Veja mais</a>
                            </div>
                        </div>
                        <!-- Card 3 -->
                        <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <img src="https://placehold.co/400x200" alt="Image of educational opportunity"
                                class="w-full h-48 object-cover" />
                            <div class="p-6">
                                <div class="flex space-x-2 mb-4">
                                    <span
                                        class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">Categoria</span>
                                    <span class="bg-red-500 text-white text-xs px-3 py-1 rounded-full">Deadline</span>
                                    <span class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Nível</span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-800 mb-2">Nome</h3>
                                <p class="text-sm text-gray-600 mb-4">Descrição breve da oportunidade</p>
                                <a href="oportunidade" class="text-purple-600 font-semibold">Veja mais</a>
                            </div>
                        </div>

                        <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <img src="https://placehold.co/400x200" alt="Image of educational opportunity"
                                class="w-full h-48 object-cover" />
                            <div class="p-6">
                                <div class="flex space-x-2 mb-4">
                                    <span
                                        class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">Categoria</span>
                                    <span class="bg-red-500 text-white text-xs px-3 py-1 rounded-full">Deadline</span>
                                    <span class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Nível</span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-800 mb-2">Nome</h3>
                                <p class="text-sm text-gray-600 mb-4">Descrição breve da oportunidade</p>
                                <a href="oportunidade" class="text-purple-600 font-semibold">Veja mais</a>
                            </div>
                        </div>

                        <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <img src="https://placehold.co/400x200" alt="Image of educational opportunity"
                                class="w-full h-48 object-cover" />
                            <div class="p-6">
                                <div class="flex space-x-2 mb-4">
                                    <span
                                        class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">Categoria</span>
                                    <span class="bg-red-500 text-white text-xs px-3 py-1 rounded-full">Deadline</span>
                                    <span class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Nível</span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-800 mb-2">Nome</h3>
                                <p class="text-sm text-gray-600 mb-4">Descrição breve da oportunidade</p>
                                <a href="oportunidade" class="text-purple-600 font-semibold">Veja mais</a>
                            </div>
                        </div>

                        <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <img src="https://placehold.co/400x200" alt="Image of educational opportunity"
                                class="w-full h-48 object-cover" />
                            <div class="p-6">
                                <div class="flex space-x-2 mb-4">
                                    <span
                                        class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">Categoria</span>
                                    <span class="bg-red-500 text-white text-xs px-3 py-1 rounded-full">Deadline</span>
                                    <span class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Nível</span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-800 mb-2">Nome</h3>
                                <p class="text-sm text-gray-600 mb-4">Descrição breve da oportunidade</p>
                                <a href="oportunidade" class="text-purple-600 font-semibold">Veja mais</a>
                            </div>
                        </div>

                        <div class="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <img src="https://placehold.co/400x200" alt="Image of educational opportunity"
                                class="w-full h-48 object-cover" />
                            <div class="p-6">
                                <div class="flex space-x-2 mb-4">
                                    <span
                                        class="bg-purple-600 text-white text-xs px-3 py-1 rounded-full">Categoria</span>
                                    <span class="bg-red-500 text-white text-xs px-3 py-1 rounded-full">Deadline</span>
                                    <span class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">Nível</span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-800 mb-2">Nome</h3>
                                <p class="text-sm text-gray-600 mb-4">Descrição breve da oportunidade</p>
                                <a href="oportunidade" class="text-purple-600 font-semibold">Veja mais</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <footer class="bg-[#A459D1] py-10 mt-12 rounded-t-3xl">
            <div class="max-w-5xl mx-auto px-[60px] flex justify-between items-start">
                <div class="flex flex-col items-start">
                    <div class="flex flex-1 w-full h-full">
                        <img src="/images/logo-light-footer.svg" class="mt-7" />
                    </div>
                    <div class="text-white mt-48">
                        <p>Siga nossas redes sociais:</p>
                        <div class="flex space-x-4 mt-2">
                            <a href="#" class="text-white flex items-center">
                                <i class="fab fa-instagram mr-2"></i> Instagram
                            </a>
                            <a href="#" class="text-white flex items-center">
                                <i class="fab fa-linkedin mr-2"></i> LinkedIn
                            </a>
                        </div>
                    </div>
                </div>
                <div class="text-white text-left">
                    <h2 class="text-[24px] font-semibold mb-2">Navegação</h2>
                    <ul class="flex flex-col space-y-1">
                        <li v-for="link in ['Início', 'Sobre nós', 'Oportunidades']">
                            <a href="#" class="text-white text-[14px] hover:text-yellow-500 font-bold">{{ link }}
                            </a>
                        </li>
                        <li v-for="category in [
                            'Olimpíadas Científicas',
                            'Programas de Intercâmbio',
                            'Competições de Escrita',
                            'Mentorias',
                            'Bolsas de Estudo',
                            'MUNs',
                        ]">
                            <a href="#" class="text-white text-[14px] hover:text-yellow-500">{{ category }}
                            </a>
                        </li>
                        <li>
                            <a href="#" class="text-white text-[14px] hover:text-yellow-500 font-bold">Veja Tudo
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </footer>
    </body>
</template>
