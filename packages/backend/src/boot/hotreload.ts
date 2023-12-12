import { NestFactory} from "@nestjs/core";
import { MainModule} from "@/MainModule.js";


export const viteNodeApp = NestFactory.create(MainModule);
