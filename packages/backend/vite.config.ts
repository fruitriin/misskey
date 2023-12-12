import { defineConfig } from 'vite'
import { VitePluginNode } from 'vite-plugin-node';
import * as path from "path";
import {MainModule} from "./src/MainModule";

export default defineConfig({
	server: {
		port: 3000
	},
	plugins: [
		// https://blog.logrocket.com/getting-started-with-nestjs-vite-esbuild/#installing-configuring-nestjs-app
		...VitePluginNode({
			adapter: 'nest',
			appPath: './src/boot/hotreload.ts',
			initAppOnBoot: true,
			tsCompiler: 'swc',
		})
	],
	optimizeDeps: {
		exclude: [
			// '@nestjs/microservices',
			// '@nestjs/websockets',
			// 'cache-manager',
			// 'class-transformer',
			// 'class-validator',
			// 'fastify-swagger',
			"re2",
			"sharp",
			"fsevents",
			"@mapbox",
			"slacc",
			"pkce-challenge",
			"aws-sdk",
			"mock-aws-s3",
			"fluent-ffmpeg"
		],
		// デコレーターが動かないViteのバグがある
		// Workaround https://github.com/vitejs/vite/issues/13736#issuecomment-1633959286
		esbuildOptions: {
			tsconfig: 'tsconfig.json'
		},
	},
	resolve: {
		alias: {
			"@/": path.join(__dirname, "src/")
		}
	}
})
