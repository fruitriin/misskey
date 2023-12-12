import { NestFactory} from "@nestjs/core";
import { MainModule} from "@/MainModule.js";
import {server} from "@/boot/common.js";


export const viteNodeApp = NestFactory.create(server());
