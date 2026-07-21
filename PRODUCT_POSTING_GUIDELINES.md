# Pantix E-Commerce Store
## Product Posting & Image Upload Guidelines for Admins

This guide is for store managers and clients to upload products and images perfectly onto the **Pantix** administration panel, ensuring they display beautifully on the customer website.

---

### 1. Basic Product Information
*   **Product Name:** Keep it descriptive and appealing (e.g., *Scarlet Banarasi Silk Saree*).
*   **Description:** Write clear details about fabric type, material, styling options, and care instructions. This helps build customer trust.
*   **SKU (Stock Keeping Unit):** **Required.** Enter a unique identifier (e.g., `SKU-SCARLET-BANARASI`). 
    *   *Note: Customers can search the store by typing the exact SKU in the search bar, but the SKU is kept hidden from all public product details/listings.*
*   **Badge:** Optional. Add labels like `Bestseller`, `New`, `Popular`, or `Bridal` to display a gold ribbon on the product image.

---

### 2. Sizing & Inventory Options
There are two ways to configure products depending on whether they have color choices.

#### Option A: Simple Product (No Color Variants)
1.  **Remove/Clear** all color variants from the bottom section.
2.  Go to the **Available Sizes** checklist and select the sizes that are in stock. The sizes should be clearly specified (e.g., size name: `XS`, `S`, `M`, `L`, `XL`, `XXL`, `3XL`, `4XL`, `5XL`, `6XL`, or `Free Size`).
3.  In the **Pricing & Inventory** card, enter the overall stock quantity in the **Stock qty** field.

#### Option B: Multi-Color Product (Recommended)
1.  Add a **Color Variant** for each option.
2.  Use the color picker to select the color hex code, and type the color name. The colour name should be clearly written (e.g., colourname: `Red`, `Emerald Green`, `Navy Blue`, `Peach`).
3.  **Click on each size** under that color and enter the exact stock quantity for that size. The sizes should be clearly selected (e.g., size name: `XS`, `S`, `M`, `L`, `XL`, `XXL`, `3XL`, `4XL`, `5XL`, `6XL`, or `Free Size`).
4.  *Note: The main "Stock qty" input will be disabled and automatically calculated based on the sum of all sizes across all colors.*

---

### 3. Image Upload & Format Guidelines
Images determine the look of your store. Follow these instructions for clean rendering:

*   **Accepted Formats:** `.jpg`, `.jpeg`, `.png`, and `.webp`.
*   **Resolution Recommendation:** Use vertical aspect ratio images (width-to-height ratio of 3:4, e.g., `800x1067px` or `1200x1600px`). Keep file sizes under 2MB for fast loading times.

#### Where to upload:
*   **For Multi-Color Products:** Always upload images under the **Color Specific Images** section of the matching color variant. Do NOT upload fallback images at the top of the form.
*   **For Simple Products:** Upload the primary cover and additional images inside the fallback **Images** section at the top of the form.

#### How to upload:
1.  **Direct Upload (Recommended):** Click **"upload from computer"** or **"Or Upload File"** to select a file directly from your device. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`.
2.  **Server Path (Advanced):** If the image is already on the server, you can type its filename from the public `/images/` directory (e.g. `product-saree-1.jpg`).
3.  **External Link:** You can paste a full HTTPS URL link to the image (e.g. `https://myimagehost.com/saree.jpg`).

#### Cover Image Resolution Logic:
*   The site automatically uses the **first image of the first color variant** as the primary product cover in the listing.
*   When a customer clicks a specific color on the product page, the page slideshow instantly switches to display only the images uploaded under that chosen color.

---

### 4. Pricing & Commission
*   **Price (₹):** The final selling price displayed to customers.
*   **MRP (₹):** The original list price. Ensure the MRP is greater than or equal to the Price. The site will automatically calculate and display the discount percentage (e.g., `25% off`).
*   **Commission Rate (%):** Optional. Enter the commission rate percentage for resellers if active (e.g., `10` for 10%).

---

### 5. Categorisation & Visibility
*   **Category:** Select the matching category from the dropdown (e.g., *3 Piece Kurta Sets*).
*   **Category Label:** The actual text shown to the customer (e.g. *3 Piece Kurta Sets (M–XXL)*).
*   **Status Toggle (Active):** Switch **ON** to publish immediately, or **OFF** to save as a draft.
*   **Collections:**
    *   **Budget Collection:** Switch ON to feature the product in the Under ₹999 / Budget Section.
    *   **Popular Collection:** Switch ON to feature it in the Best Sellers section.
