document.addEventListener("DOMContentLoaded", function () {
  // Load profile information
  loadProfileInfo();

  // Make all links open in a new tab
  makeAllLinksOpenInNewTab();

  // Set up MutationObserver to watch for dynamically added links
  setupLinkObserver();

  // Publication filters - including "First Author" for publications where user is first author or has equal contribution
  const filterBtns = document.querySelectorAll(".filter-btn");
  const publications = document.querySelectorAll(".publication");

  // Load publications data from JSON file
  loadPublications();

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove("active"));

      // Add active class to clicked button
      this.classList.add("active");

      // Get filter value
      const filterValue = this.getAttribute("data-filter");

      // Filter publications
      const pubElements = document.querySelectorAll(".publication");
      pubElements.forEach((pub) => {
        if (filterValue === "all") {
          pub.style.display = "flex";
        } else if (pub.classList.contains(filterValue)) {
          pub.style.display = "flex";
        } else {
          pub.style.display = "none";
        }
      });
    });
  });

  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // Only apply smooth scrolling to hash links (internal page links)
      if (this.getAttribute("href").startsWith("#")) {
        e.preventDefault();

        const targetId = this.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          window.scrollTo({
            top: targetSection.offsetTop - 100,
            behavior: "smooth",
          });

          // Update active class
          navLinks.forEach((l) => l.classList.remove("active"));
          this.classList.add("active");
        }
      }
    });
  });

  // Update active nav link on scroll
  window.addEventListener("scroll", function () {
    let current = "";
    const sections = document.querySelectorAll("section");

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (pageYOffset >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href").substring(1) === current) {
        link.classList.add("active");
      }
    });
  });

  // Load news data
  // Determine the correct path for news.json based on current page
  let newsJsonPath = "data/news.json";
  if (window.location.pathname.includes("/pages/")) {
    // If we're in the pages directory, we need to go up one level
    newsJsonPath = "../data/news.json";
  }

  fetch(newsJsonPath)
    .then((response) => response.json())
    .then((data) => {
      // Check if we're on the homepage
      const latestNewsSection = document.getElementById("latest-news");
      if (latestNewsSection) {
        // On homepage - show limited news (first 8 items)
        renderNewsItems(data.slice(0, 8), "news-container");
      }

      // Check if we're on the all-news page
      const allNewsSection = document.getElementById("all-news");
      if (allNewsSection) {
        // On all-news page - show all news items
        renderNewsItems(data, "all-news-container");
      }
    })
    .catch((error) => {
      console.error("Error loading news data:", error);
    });
});

// Function to load profile information
function loadProfileInfo() {
  let profileJsonPath = "data/profile-info.json";
  let isSubpage = window.location.pathname.includes("/pages/");
  if (isSubpage) {
    profileJsonPath = "../data/profile-info.json";
  }

  // Get profile-info container
  const profileInfoContainer = document.querySelector(".profile-info");
  if (!profileInfoContainer) return;

  fetch(profileJsonPath)
    .then((response) => response.json())
    .then((data) => {
      // Clear existing content
      profileInfoContainer.innerHTML = "";

      // Add name
      const nameElement = document.createElement("h1");
      nameElement.textContent = data.name;
      profileInfoContainer.appendChild(nameElement);

      // Add subtitle
      const subtitleElement = document.createElement("p");
      subtitleElement.className = "subtitle";
      subtitleElement.innerHTML = data.subtitle;
      profileInfoContainer.appendChild(subtitleElement);

      // Add social links container
      const contactInfo = document.createElement("div");
      contactInfo.className = "contact-info";

      // Add each social link
      data.socialLinks.forEach((link) => {
        const linkContainer = document.createElement("p");
        const anchor = document.createElement("a");
        // Adjust URL paths for subpages
        if (isSubpage && link.url.startsWith("assets/")) {
          anchor.href = "../" + link.url;
        } else {
          anchor.href = link.url;
        }

        // Set target attribute - either from JSON or default to "_blank" for external links
        if (link.target) {
          anchor.target = link.target;
        } else if (link.url && !link.url.startsWith("#")) {
          anchor.target = "_blank";
        }

        // Fix SVG icon paths for subpages
        let iconHtml = link.icon;
        if (isSubpage && link.type === "dblp") {
          iconHtml = iconHtml.replace('src="assets/', 'src="../assets/');
        }

        anchor.innerHTML = iconHtml;
        linkContainer.appendChild(anchor);
        contactInfo.appendChild(linkContainer);
      });

      profileInfoContainer.appendChild(contactInfo);

      // Update profile image if there's a profile-image container
      const profileImageContainer =
        document.querySelector(".profile-image img");
      if (profileImageContainer && data.profileImage) {
        profileImageContainer.src = isSubpage
          ? "../" + data.profileImage
          : data.profileImage;
        profileImageContainer.alt = data.name;
      }
    })
    .catch((error) => {
      console.error("Error loading profile information:", error);
    });
}

// Function to load publications from JSON
function loadPublications() {
  let publicationsJsonPath = "data/publications.json";
  if (window.location.pathname.includes("/pages/")) {
    publicationsJsonPath = "../data/publications.json";
  }

  const publicationsList = document.querySelector(".publications-list");
  if (!publicationsList) return;

  // Clear existing publications
  publicationsList.innerHTML = "";

  fetch(publicationsJsonPath)
    .then((response) => response.json())
    .then((publications) => {
      publications.forEach((pub) => {
        // Create publication wrapper
        const pubElement = document.createElement("div");
        const classes = ["publication", pub.type];
        if (pub.isFirstAuthor) classes.push("first-author");
        pubElement.className = classes.join(" ");

        // Publication number
        const numberElement = document.createElement("span");
        numberElement.className = "pub-number";
        numberElement.textContent = pub.number;

        // Content container: only text
        const contentElement = document.createElement("div");
        contentElement.className = "pub-content";

        const textContainer = document.createElement("div");
        textContainer.className = "pub-text";

        // Title
        // Inside your loadPublications() loop, after you've created pub.tags…
        const doiTag = pub.tags.find((tag) => tag.text === "DOI" && tag.link);
        const doiLink = doiTag ? doiTag.link : null;

        // Build the <h3> (with or without an <a>)
        const titleElement = document.createElement("h3");
        if (doiLink) {
          const a = document.createElement("a");
          a.href = doiLink;
          a.target = "_blank";
          a.rel = "noopener";
          a.textContent = pub.title;
          titleElement.appendChild(a);
        } else {
          titleElement.textContent = pub.title;
        }

        // Finally append into your textContainer
        textContainer.appendChild(titleElement);

        // Authors
        const authorsElement = document.createElement("p");
        authorsElement.className = "authors";
        authorsElement.innerHTML = pub.authors;
        textContainer.appendChild(authorsElement);

        // Venue
        if (pub.venue) {
          const venueElement = document.createElement("p");
          venueElement.className = "venue";
          venueElement.textContent = pub.venue;
          textContainer.appendChild(venueElement);
        }

        // Tags
        const tagsContainer = document.createElement("div");
        tagsContainer.className = "pub-tags";
        pub.tags.forEach((tag) => {
          let tagEl;
          if (tag.link) {
            tagEl = document.createElement("a");
            tagEl.href = tag.link;
            tagEl.setAttribute("target", "_blank");
          } else {
            tagEl = document.createElement("span");
          }
          tagEl.className = `tag ${tag.class}`;
          tagEl.textContent = tag.text;
          tagsContainer.appendChild(tagEl);
        });
        textContainer.appendChild(tagsContainer);

        if (pub.pdf) {
            const pdfTag = document.createElement('a');
            pdfTag.href = pub.pdf;           // 例如 "assets/pdf/paper2.pdf"
            pdfTag.target = '_blank';
            pdfTag.rel = 'noopener';
            pdfTag.className = 'tag pdf-tag';
            pdfTag.textContent = 'PDF';
            tagsContainer.appendChild(pdfTag);
          }

        contentElement.appendChild(textContainer);

        // Image container: sibling of content
        const imgContainer = document.createElement("div");
        imgContainer.className = "pub-image-container";

        if (pub.image) {
          const imgElement = document.createElement("img");
          imgElement.src = pub.image;
          imgElement.alt = pub.title;

          if (doiLink) {
            // 有 doi 链接，就用 <a> 包裹图片
            const a = document.createElement("a");
            a.href = doiLink;
            a.target = "_blank";
            a.rel = "noopener";
            a.appendChild(imgElement);
            imgContainer.appendChild(a);
          } else {
            // 没有链接直接插入图片
            imgContainer.appendChild(imgElement);
          }
        }

        // Assemble publication element
        pubElement.appendChild(numberElement);
        pubElement.appendChild(contentElement);
        pubElement.appendChild(imgContainer);
        publicationsList.appendChild(pubElement);
      });
    })
    .catch((error) => {
      console.error("Error loading publications data:", error);
    });
}

// Function to render news items
function renderNewsItems(newsData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear any existing content
  container.innerHTML = "";

  // Add each news item to the container
  newsData.forEach((newsItem) => {
    const newsElement = document.createElement("div");
    newsElement.className = "news-item";

    // Create the date element
    const dateElement = document.createElement("div");
    dateElement.className = "news-date";

    const dateHighlight = document.createElement("span");
    dateHighlight.className = "year-highlight";
    dateHighlight.textContent = newsItem.date;
    dateElement.appendChild(dateHighlight);

    // Create the content element
    const contentElement = document.createElement("div");
    contentElement.className = "news-content";

    // Create the title element
    const titleElement = document.createElement("h3");

    // Check if title contains HTML (like '<a href=')
    if (newsItem.title && newsItem.title.includes("<a href=")) {
      // Parse HTML in title
      titleElement.innerHTML = newsItem.title;
    } else {
      titleElement.textContent = newsItem.title;
    }

    contentElement.appendChild(titleElement);

    // Create the paragraph for content
    const paragraphElement = document.createElement("p");
    paragraphElement.innerHTML = newsItem.content;

    // Add links if provided in the links array format
    if (newsItem.links && newsItem.links.length > 0) {
      newsItem.links.forEach((link) => {
        // Add a space if needed
        const space = document.createTextNode(" ");
        paragraphElement.appendChild(space);

        // Create link
        const linkElement = document.createElement("a");
        linkElement.href = link.url;
        linkElement.textContent = link.text;
        // Add target="_blank" for external links
        if (link.url && !link.url.startsWith("#")) {
          linkElement.setAttribute("target", "_blank");
        }
        paragraphElement.appendChild(linkElement);
      });
    }

    // Check for old style link (backward compatibility)
    if (newsItem.link && newsItem.linkText) {
      const space = document.createTextNode(" ");
      paragraphElement.appendChild(space);

      const linkElement = document.createElement("a");
      linkElement.href = newsItem.link;
      linkElement.textContent = newsItem.linkText;
      // Add target="_blank" for external links
      if (newsItem.link && !newsItem.link.startsWith("#")) {
        linkElement.setAttribute("target", "_blank");
      }
      paragraphElement.appendChild(linkElement);
    }

    contentElement.appendChild(paragraphElement);

    // Add date and content to the news item
    newsElement.appendChild(dateElement);
    newsElement.appendChild(contentElement);

    // Add the news item to the container
    container.appendChild(newsElement);
  });
}

// Function to make all links open in a new tab
function makeAllLinksOpenInNewTab() {
  // Get all links in the document
  const links = document.querySelectorAll("a");

  // Loop through each link
  links.forEach((link) => {
    const href = link.getAttribute("href");
    // Skip navigation links (links that start with #) and links without href
    if (href && !href.startsWith("#")) {
      // Set target to _blank to open in a new tab
      link.setAttribute("target", "_blank");
    }
  });
}

// Function to set up a MutationObserver to watch for new links
function setupLinkObserver() {
  // Select the target node (in this case, the entire document body)
  const targetNode = document.body;

  // Options for the observer (which mutations to observe)
  const config = {
    childList: true, // observe direct children
    subtree: true, // and lower descendants too
    characterData: false, // don't care about text changes
    attributes: false, // don't care about attribute changes
  };

  // Callback function to execute when mutations are observed
  const callback = function (mutationsList, observer) {
    // Check if any new nodes were added
    let newLinksAdded = false;

    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if any of the added nodes are links or contain links
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            // ELEMENT_NODE
            if (node.tagName === "A") {
              newLinksAdded = true;
              break;
            } else if (node.querySelectorAll) {
              const links = node.querySelectorAll("a");
              if (links.length > 0) {
                newLinksAdded = true;
                break;
              }
            }
          }
        }
      }

      if (newLinksAdded) break;
    }

    // If new links were added, update them to open in new tabs
    if (newLinksAdded) {
      makeAllLinksOpenInNewTab();
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config);
}
