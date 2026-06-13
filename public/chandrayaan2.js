// High-Performance Apple-Tier Scroll Engine
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.scroll-section');

    function onScroll() {
        const windowHeight = window.innerHeight;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            // scrollDistance is how much we have to scroll to go from top hitting viewport to bottom hitting bottom
            const scrollDistance = rect.height - windowHeight;
            let progress = 0;
            
            if (rect.top <= 0) {
                progress = Math.abs(rect.top) / scrollDistance;
            }
            
            // Clamp progress between 0 and 1
            progress = Math.max(0, Math.min(1, progress));
            
            // Apply CSS variables
            section.style.setProperty('--scroll', progress);
            
            // Math.sin curve (starts 0, peaks 1 at middle, ends 0)
            const sine = Math.sin(progress * Math.PI);
            section.style.setProperty('--scroll-sine', sine);
            
            // Early curve (hits 1 fast, by 30%)
            const early = Math.min(1, progress * 3.33);
            section.style.setProperty('--scroll-early', early);
            
            // Late curve (starts at 50%, hits 1 at 80%)
            const late = Math.max(0, Math.min(1, (progress - 0.5) * 3.33));
            section.style.setProperty('--scroll-late', late);
        });
        
        requestAnimationFrame(onScroll);
    }

    // Start the loop
    requestAnimationFrame(onScroll);
});
