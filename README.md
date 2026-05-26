# Its My Cutlist 📏🪵

A premium, privacy-first, zero-server 1D material bin-packing optimizer built entirely inside the client's browser. Designed for high-speed, rugged workshops and builder yard operations, it optimizes timber, metal, PVC, and sheet cuts to reduce material waste down to near 0%.

## Key Features

- **Asymmetric Bento Grid UI**: High-density cockpit layout optimized for mobile and desktop screens.
- **Client-Side Bin-Packing Engine**: Fast-Fit Decreasing heuristic with scrap pile priority and blade kerf compensation.
- **Swipe-to-Check Tracker**: Visual, tactile cut tracker with real-time feedback for workshop operator progress.
- **Zero-Server, Privacy-First Architecture**: 100% data residency in LocalStorage. No databases, no external trackers, no accounts.
- **Cryptographic Activation Gate**: Verify licenses online and sign tokens locally using HMAC-SHA256 for a secure 5-device limit and permanent offline work.
- **Printer-Friendly Manifests**: Generate clean, printer-friendly workshop guides and layout guides with one click.
- **Future-Proof Compliance**: Fully compliant with GDPR and the Data Use and Access Act. Includes equal prominence cookie consent and fully detailed statutory policies.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4 & Vanilla CSS Print Styles
- **Icons**: Lucide React
- **Cryptography**: Web Crypto API (HMAC-SHA256)

## Getting Started

### Prerequisites

- Node.js (v18.x or later recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/itsmyapp-code/its-my-cutlist.git
   cd its-my-cutlist
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional for local development, fallback values are active):
   ```env
   ACTIVATION_SECRET="your-jwt-hmac-secret-key"
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Optimization Engine Heuristic

The optimization engine implements a greedy bin-packing variant (First-Fit Decreasing) that:
1. Sorts all required cut list parts in descending length order.
2. Intersects and exhausts prioritized **Scrap Offcuts** before drawing from brand-new **Stock Boards**.
3. Deducts cutting losses for every cut based on the specified **Blade Kerf** thickness.
4. Generates real-time yield optimization percentages and lists unplaced parts exceeding the maximum stock length.

## License

Standard EULA. Owned by Its My App Code.
