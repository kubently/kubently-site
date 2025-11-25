document.addEventListener('DOMContentLoaded', () => {
  
  // --- Typewriter Effect ---
  const textToType = [
    "> kubently debug",
    "Waiting for connection... Connected.",
    "AI Agent: Hello! I'm listening. What's wrong with your cluster?",
    "> Why is the payment-service crashing?",
    "AI Agent: Checking logs for 'payment-service' in namespace 'default'...",
    "Found 'CrashLoopBackOff'. Recent logs indicate:",
    "'Error: ConnectionRefused at db:5432'",
    "It seems the database is unreachable. Should I check the DB pod status?",
    "> Yes, please.",
    "AI Agent: Executing 'kubectl get pods -l app=postgres'...",
    "Pod 'postgres-0' is Pending. Reason: 'InsufficientCPU'.",
    "Analysis: The database cannot start due to resource quotas."
  ];

  const typewriterElement = document.getElementById('typewriter');
  let lineIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 50;
  let pauseBetweenLines = 800; // ms

  function type() {
    if (!typewriterElement) return;

    // Check if we are done with all lines
    if (lineIndex >= textToType.length) {
        // Optional: Reset after a long pause or just stop
        setTimeout(() => {
            typewriterElement.innerHTML = '';
            lineIndex = 0;
            type();
        }, 5000);
        return;
    }

    const currentLine = textToType[lineIndex];
    
    // Logic to create new lines vs appending chars
    // We'll treat the innerHTML as a list of divs
    
    // Get the current lines content so far
    // But actually, we want to append line by line
    
    // Let's simplify: We render all previous lines fully, and the current line partially.
    let html = '';
    for(let i=0; i < lineIndex; i++) {
        const lineClass = textToType[i].startsWith('>') ? 'command-line' : 'response-line';
        html += `<div class="${lineClass}">${textToType[i]}</div>`;
    }
    
    const currentClass = currentLine.startsWith('>') ? 'command-line' : 'response-line';
    const currentText = currentLine.substring(0, charIndex + 1);
    html += `<div class="${currentClass}">${currentText}<span class="cursor"></span></div>`;
    
    typewriterElement.innerHTML = html;

    charIndex++;

    if (charIndex < currentLine.length) {
        setTimeout(type, typingSpeed);
    } else {
        // Line finished
        charIndex = 0;
        lineIndex++;
        setTimeout(type, pauseBetweenLines);
    }
  }

  // Start typing if element exists
  if (document.getElementById('typewriter')) {
      type();
  }


  // --- Scroll Reveal Animation ---
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optional: Stop observing once revealed
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.15, // Trigger when 15% visible
    rootMargin: "0px"
  });

  revealElements.forEach(el => revealObserver.observe(el));

});
