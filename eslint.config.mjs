import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("eslint:recommended"), {
    languageOptions: {
        globals: {
            ...globals.browser,
            bootstrap: "readonly",
            firebase: "readonly",
            firebaseui: "readonly",
            google: "readonly",
            workbox: "readonly",
            importScripts: "readonly",
            localforage: "readonly",
            pdfjsLib: "readonly",
            PDFLib: "readonly",
            download: "readonly",
        },

        ecmaVersion: 2020,
        sourceType: "module",
    },

    rules: {},
}];