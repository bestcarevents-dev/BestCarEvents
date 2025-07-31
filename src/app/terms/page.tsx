export default function TermsOfServicePage() {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-gray-900">Terms of Service</h1>
            <p className="mt-4 text-lg text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700">
            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using BestCarEvents ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">2. Description of Service</h2>
              <p className="mb-4">
                BestCarEvents is a platform that connects automotive enthusiasts, providing services including but not limited to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Car marketplace for buying and selling vehicles</li>
                <li>Event discovery and hosting platform</li>
                <li>Car hotel and storage services</li>
                <li>Automotive club connections</li>
                <li>Advertising and promotional services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">3. User Accounts</h2>
              <p className="mb-4">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">4. User Conduct</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Use the Service for any unlawful purpose</li>
                <li>Post false, misleading, or fraudulent information</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with or disrupt the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">5. Content and Intellectual Property</h2>
              <p className="mb-4">
                You retain ownership of any content you submit to the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content in connection with the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">6. Privacy Policy</h2>
              <p className="mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">7. Disclaimers</h2>
              <p className="mb-4">
                The Service is provided "as is" without any warranties. We do not guarantee the accuracy, completeness, or usefulness of any information on the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall BestCarEvents be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">9. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new Terms of Service on this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold font-headline text-gray-900 mb-4">11. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  Email: legal@bestcarevents.com<br />
                  Address: [Your Business Address]<br />
                  Phone: [Your Phone Number]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 