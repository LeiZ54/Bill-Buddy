module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        screens: {
            'sm': '640px',  
            'md': '768px',  
            'lg': '1024px',  
            'xl': '1280px', 
        },
        extend: {},
    },
    plugins: [],
    corePlugins: {
        preflight: false,
    }
}