# Test Instructions: Website

These test-writing instructions are **framework-agnostic**.

## Overview

The Website is a multi-site architecture with global homepage, Lab mini-sites, e-commerce, and various content sections. Standalone (no app shell).

---

## User Flow Tests

### Flow 1: Navigate from Global to Lab

**Steps:**
1. Visitor arrives at the global homepage
2. Sees impact stats, featured content
3. Clicks on a Lab from the directory
4. Lab mini-site loads with its active poles

**Expected Results:**
- [ ] Global homepage shows impact counters (trees planted, hectares, etc.)
- [ ] Lab cards show name, region, description
- [ ] Clicking Lab navigates to Lab mini-site
- [ ] Lab mini-site shows only active poles (not all 4)
- [ ] Newsletter CTA is visible

### Flow 2: Register for a Course

**Steps:**
1. Visitor navigates to Academy section of a Lab
2. Browses course catalog
3. Applies filters (category, level, format)
4. Clicks on a course for details
5. Clicks "S'inscrire"

**Expected Results:**
- [ ] Course catalog shows available courses with details
- [ ] Filters narrow results correctly
- [ ] Course detail shows: description, price, dates, spots available, instructors
- [ ] Registration CTA prominent
- [ ] "Complet" indicator if no spots available

### Flow 3: Purchase Products

**Steps:**
1. Visitor browses product catalog
2. Filters by country (for local pickup)
3. Adds product to cart
4. Opens cart, adjusts quantity
5. Proceeds to checkout
6. Selects pickup nursery, enters info
7. Completes order

**Expected Results:**
- [ ] Products filtered by selected country
- [ ] Cart icon shows item count
- [ ] Cart displays items, quantities, total
- [ ] Checkout requires: pickup location, name, email, phone
- [ ] Order confirmation shown

### Flow 4: View Project Portfolio

**Steps:**
1. Visitor navigates to the project portfolio
2. Sees completed and in-progress projects
3. Clicks on a project for details
4. Sees "Soutenir ce projet" on a funding project

**Expected Results:**
- [ ] Projects show: title, location, surface, trees planted, status
- [ ] Funding progress visible on fundraising projects
- [ ] Donation CTA on eligible projects
- [ ] Client testimonials displayed (if available)

---

## Empty State Tests

### No Featured Content

**Expected Results:**
- [ ] Homepage sections gracefully hide when no featured content
- [ ] At minimum, Lab directory always shows

### No Courses Available

**Expected Results:**
- [ ] Message: "Aucune formation disponible actuellement"
- [ ] Newsletter CTA: "Inscrivez-vous pour être informé"

### Empty Cart

**Expected Results:**
- [ ] Message: "Votre panier est vide"
- [ ] CTA: "Continuer vos achats"

### No Products in Country

**Setup:** Country filter selected with no matching products

**Expected Results:**
- [ ] Message: "Aucun produit disponible dans votre pays"
- [ ] Suggestion to check other countries

---

## Component Tests

### LabHomepage
- [ ] Shows Lab hero with name and description
- [ ] Displays only active poles
- [ ] Shows upcoming courses and events
- [ ] Newsletter CTA visible

### ProductCatalog
- [ ] Country selector works
- [ ] Product cards show: image, name, price, stock
- [ ] "Add to cart" button on each product
- [ ] Cart icon with count in header

### NewsletterCta
- [ ] Email input field
- [ ] Submit button
- [ ] Success message after submission
- [ ] Error for invalid email

### ArticleCard
- [ ] Shows: title, excerpt, author, date, reading time
- [ ] Category badge visible
- [ ] Click navigates to article detail

---

## Edge Cases

- [ ] Lab with only 1 active pole
- [ ] Course with 0 spots available (shows "Complet")
- [ ] Product with 0 stock (not purchasable)
- [ ] Very long article content renders properly
- [ ] Multiple languages: language selector works

---

## Sample Test Data

```typescript
const mockLab = {
  id: "lab-1",
  name: "Semisto Wallonie",
  slug: "wallonie",
  country: "Belgique",
  region: "Wallonie",
  activePoles: ["design-studio", "academy", "nursery"],
  description: "Lab initial du mouvement Semisto"
};

const mockCourse = {
  id: "course-1",
  title: "Design de Jardin-Forêt",
  price: 450,
  currency: "EUR",
  nextSession: "2024-04-15",
  spotsAvailable: 5,
  spotsTotal: 15,
  level: "débutant",
  format: "présentiel"
};

const mockProduct = {
  id: "product-1",
  name: "Pommier Belle de Boskoop",
  type: "plant",
  price: 18.50,
  currency: "EUR",
  stock: 25,
  countries: ["BE", "FR"]
};
```
