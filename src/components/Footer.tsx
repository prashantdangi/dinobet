import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            <p className="text-sm text-gray-300">
              Experience the thrill of the Dino Game while ensuring a safe and enjoyable gaming environment.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Policies</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/shipping-policy" className="text-sm text-gray-300 hover:text-white">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-conditions" className="text-sm text-gray-300 hover:text-white">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/cancellation-refunds" className="text-sm text-gray-300 hover:text-white">
                  Cancellation & Refunds
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-sm text-gray-300 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-300">Email: prashantdangi983@gmail.com</li>
              <li className="text-sm text-gray-300">Phone: +91 7042218746</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {/* Add social media icons/links here if needed */}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-800">
          <p className="text-center text-sm text-gray-300">
            © {new Date().getFullYear()} Dino Game. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 