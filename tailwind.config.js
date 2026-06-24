import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                'green-deep': 'var(--green-deep)',
                'green-mid': 'var(--green-mid)',
                'green-light': 'var(--green-light)',
                'green-pale': 'var(--green-pale)',
                'green-mist': 'var(--green-mist)',
                'cream': 'var(--cream)',
                'cream-dark': 'var(--cream-dark)',
            }
        },
    },

    plugins: [forms],
};
