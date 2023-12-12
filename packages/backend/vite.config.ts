import { defineConfig } from 'vite'
import { VitePluginNode } from 'vite-plugin-node';
import * as path from "path";

export default defineConfig({
	build: {
		target: "ES2022"
	},
	// esbuild: {
	// 	tsconfigRaw: {
	// 		compilerOptions: {
	// 			experimentalDecorators: true
	// 		}
	// 	}
	// },
	plugins: [
		// https://blog.logrocket.com/getting-started-with-nestjs-vite-esbuild/#installing-configuring-nestjs-app
		...VitePluginNode({
			// Nodejs native Request adapter
			// currently this plugin support 'express', 'nest', 'koa' and 'fastify' out of box,
			// you can also pass a function if you are using other frameworks, see Custom Adapter section
			adapter: 'nest',
			// tell the plugin where is your project entry
			appPath: './src/boot/entry.ts',
			// Optional, default: 'viteNodeApp'
			// the name of named export of you app from the appPath file
			exportName: 'Misskey',
			// Optional, default: 'esbuild'
			// The TypeScript compiler you want to use
			// by default this plugin is using vite default ts compiler which is esbuild
			// 'swc' compiler is supported to use as well for frameworks
			// like Nestjs (esbuild dont support 'emitDecoratorMetadata' yet)
			// you need to INSTALL `@swc/core` as dev dependency if you want to use swc
			tsCompiler: 'swc',
		})
	],
	optimizeDeps: {
		// Vite does not work well with optionnal dependencies,
		// mark them as ignored for now
		exclude: [
			'@nestjs/microservices',
			'@nestjs/websockets',
			'cache-manager',
			'class-transformer',
			'class-validator',
			'fastify-swagger',
			"aws-sdk",
			"mock-aws-s3",
			"fluent-ffmpeg"
		],
		esbuildOptions: {
			tsconfigRaw: {

				compilerOptions: {
					target: "ES2022",
					experimentalDecorators: true
				}
			}
		}
	},
	resolve: {
		alias: {
			"@/": path.join(__dirname, "src/")
		}
	}
})
