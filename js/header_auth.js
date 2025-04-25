/**
 * header_auth.js
 *
 * Updates the header navigation based on user login status.
 * - Removes 'Login' link if logged in.
 * - Adds a non-clickable profile icon before the cart if logged in.
 * - Ensures 'Login' link is present and profile icon is absent if logged out.
 *
 * Should be included AFTER api.js and BEFORE the closing </body> tag.
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log("HEADER_AUTH: Checking auth status for header update...");

    // Check if Api object and isLoggedIn function exist
    if (typeof Api === 'undefined' || typeof Api.isLoggedIn !== 'function') {
        console.error("HEADER_AUTH: Api.js or Api.isLoggedIn function not found. Cannot update header.");
        return; // Stop execution if API isn't available
    }

    const isLoggedIn = Api.isLoggedIn();

    // --- Target Elements ---
    const loginListItem = document.querySelector('.navigation-pill-list li a[href="auth.html"]')?.parentElement;
    const navCartContainer = document.querySelector('.nav-cart-container');
    const cartContainer = navCartContainer?.querySelector('.cart-container');

    const profileIconId = 'user-profile-icon';
    // *** UPDATE IMAGE URL HERE ***
    const profileIconImageUrl = 'https://assets.zenn.com/strapi_assets/food_logo_5fbb88038c.png';

    // --- Perform Updates based on Login Status ---

    if (!navCartContainer || !cartContainer) {
         console.error("HEADER_AUTH: Header structure error - navCartContainer or cartContainer not found.");
         return;
    }

    // Remove existing profile icon regardless of state first
    const existingProfileIcon = document.getElementById(profileIconId);
    if (existingProfileIcon) {
        existingProfileIcon.remove();
        console.log("HEADER_AUTH: Removed existing profile icon.");
    }

    if (isLoggedIn) {
        console.log("HEADER_AUTH: User is LOGGED IN.");

        // 1. Remove Login Link
        if (loginListItem) {
            loginListItem.remove();
            console.log("HEADER_AUTH: Login link removed.");
        } else {
             console.warn("HEADER_AUTH: Login link list item not found.");
        }

        // 2. Create and Insert Profile Icon
        const profileDiv = document.createElement('div');
        profileDiv.id = profileIconId;
        profileDiv.style.display = 'flex';
        profileDiv.style.alignItems = 'center';
        // *** ADJUST MARGINS HERE ***
        profileDiv.style.marginLeft = '10px'; // Slightly reduce left margin if needed
        // profileDiv.style.marginRight = '0px'; // Remove right margin completely

        const profileImg = document.createElement('img');
        profileImg.src = profileIconImageUrl;
        profileImg.alt = 'User Profile';
        // *** Optional: Adjust size if needed for the new image ***
        profileImg.style.width = '32px';
        profileImg.style.height = '32px';
        profileImg.style.borderRadius = '50%';
        profileImg.style.objectFit = 'cover';
        profileImg.style.border = '1px solid #eee'; // Lighter border
        profileImg.style.cursor = 'default';

        profileDiv.appendChild(profileImg);

        // Insert the profileDiv before the cartContainer
        navCartContainer.insertBefore(profileDiv, cartContainer);
        console.log("HEADER_AUTH: Profile icon added.");

    } else {
        console.log("HEADER_AUTH: User is LOGGED OUT.");

        // 1. Ensure Login Link Exists
        if (!loginListItem && document.querySelector('.navigation-pill-list')) {
             console.log("HEADER_AUTH: Login link not found. Attempting to recreate...");
             try {
                const navList = document.querySelector('.navigation-pill-list');
                 const newLoginLi = document.createElement('li');
                 const newLoginA = document.createElement('a');
                 newLoginA.href = 'auth.html';
                 newLoginA.classList.add('navigation-pill');
                 newLoginA.textContent = 'Login';
                 newLoginLi.appendChild(newLoginA);
                 navList.appendChild(newLoginLi);
                 console.log("HEADER_AUTH: Login link recreated.");
             } catch (error) {
                 console.error("HEADER_AUTH: Failed to recreate login link:", error);
             }
        } else if (loginListItem) {
            console.log("HEADER_AUTH: Login link already present.");
        }
    }

    console.log("HEADER_AUTH: Header update complete.");
});