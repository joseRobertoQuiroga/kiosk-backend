"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// cli/src/utils/logger.ts
const chalk_1 = __importDefault(require("chalk"));
exports.logger = {
    success: (message) => {
        console.log(chalk_1.default.green('✅ ' + message));
    },
    error: (message) => {
        console.log(chalk_1.default.red('❌ ' + message));
    },
    warning: (message) => {
        console.log(chalk_1.default.yellow('⚠️  ' + message));
    },
    info: (message) => {
        console.log(chalk_1.default.blue('ℹ️  ' + message));
    },
    header: (message) => {
        console.log('');
        console.log(chalk_1.default.cyan.bold('═'.repeat(60)));
        console.log(chalk_1.default.cyan.bold(message));
        console.log(chalk_1.default.cyan.bold('═'.repeat(60)));
        console.log('');
    },
    separator: () => {
        console.log(chalk_1.default.gray('─'.repeat(60)));
    },
    table: (title, data) => {
        console.log('');
        console.log(chalk_1.default.cyan.bold(title));
        exports.logger.separator();
        Object.entries(data).forEach(([key, value]) => {
            console.log(`${chalk_1.default.gray(key + ':')} ${chalk_1.default.white(value)}`);
        });
        exports.logger.separator();
        console.log('');
    },
};
