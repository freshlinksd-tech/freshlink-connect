import React, { useEffect } from 'react';
import { useSocialPlatform } from '../context/SocialPlatformContext';

interface SEOManagerProps {
  activeTab?: string;
  selectedUserId?: string | null;
  activeCategoryFilter?: string;
}

export const SEOManager: React.FC<SEOManagerProps> = ({
  activeTab = 'feed',
  selectedUserId,
  activeCategoryFilter = 'all'
}) => {
  const { users, posts, currentUser } = useSocialPlatform();

  useEffect(() => {
    let title = 'FreshLink Connect - Social Blogging & Interest Network';
    let description = 'FreshLink Connect is Nepal\'s premier interest-driven digital creator hub. Write blog posts, connect with fellow creators, chat in real-time, and monetize your content.';
    let keywords = 'freshlink, frshlink, freshlink connect, freshlinkconnect, blogging, social network, nepal creators, article publishing';
    let ogType = 'website';
    let canonicalUrl = 'https://freshlinkconnect.info/';
    let jsonLdData: any = null;

    // Selected user profile
    if (activeTab === 'profile' && selectedUserId) {
      const targetUser = users.find(u => u.id === selectedUserId) || (currentUser?.id === selectedUserId ? currentUser : null);
      if (targetUser) {
        const displayName = targetUser.name || targetUser.username || 'Creator';
        title = `${displayName} (@${targetUser.username}) - FreshLink Connect Profile`;
        description = targetUser.bio || `View ${displayName}'s profile, blog posts, and interest channels on FreshLink Connect.`;
        keywords = `${targetUser.username}, ${displayName}, freshlink creator, blog profile`;
        ogType = 'profile';
        canonicalUrl = `https://freshlinkconnect.info/?tab=profile&user=${targetUser.id}`;

        jsonLdData = {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          'mainEntity': {
            '@type': 'Person',
            'name': displayName,
            'alternateName': `@${targetUser.username}`,
            'description': targetUser.bio || '',
            'image': targetUser.avatar || 'https://freshlinkconnect.info/favicon.png',
            'identifier': targetUser.id,
            'jobTitle': targetUser.occupation || 'Content Creator'
          }
        };
      }
    } else if (activeTab === 'feed') {
      if (activeCategoryFilter && activeCategoryFilter !== 'all') {
        const categoryCap = activeCategoryFilter.charAt(0).toUpperCase() + activeCategoryFilter.slice(1);
        title = `${categoryCap} Community Feed & Blog Articles - FreshLink Connect`;
        description = `Explore trending blog posts, articles, and creators in ${categoryCap} on FreshLink Connect.`;
        keywords = `${activeCategoryFilter}, ${activeCategoryFilter} blogs, freshlink feed`;
        canonicalUrl = `https://freshlinkconnect.info/?tab=feed&category=${encodeURIComponent(activeCategoryFilter)}`;
      } else {
        title = 'Live Community Feed & Creator Posts - FreshLink Connect';
        description = 'Discover trending blog posts, creator viewpoints, interest channels, and discussions on FreshLink Connect.';
        canonicalUrl = 'https://freshlinkconnect.info/?tab=feed';
      }

      // WebSite JSON-LD
      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'FreshLink Connect',
        'alternateName': ['FreshLink', 'frshlink', 'FreshLink Connect Info'],
        'url': 'https://freshlinkconnect.info',
        'description': description,
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://freshlinkconnect.info/?tab=feed&q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      };
    } else if (activeTab === 'chat') {
      title = 'Real-Time Creator Chat & Messaging - FreshLink Connect';
      description = 'Chat directly with fellow creators, discussion partners, and community members on FreshLink Connect.';
      canonicalUrl = 'https://freshlinkconnect.info/?tab=chat';
    } else if (activeTab === 'monetization') {
      title = 'Creator Monetization & Earnings Portal - FreshLink Connect';
      description = 'Earn rewards, manage ad banners, track revenue, and request coin withdrawals on FreshLink Connect.';
      canonicalUrl = 'https://freshlinkconnect.info/?tab=monetization';
    } else if (activeTab === 'notifications') {
      title = 'Notifications & Live Interactions - FreshLink Connect';
      description = 'Stay updated on likes, comments, follows, and mention notifications on FreshLink Connect.';
      canonicalUrl = 'https://freshlinkconnect.info/?tab=notifications';
    } else if (activeTab === 'admin') {
      title = 'Platform Admin & Governance Portal - FreshLink Connect';
      description = 'Manage creators, verify accounts, handle post reports, and review monetization requests.';
      canonicalUrl = 'https://freshlinkconnect.info/?tab=admin';
    }

    // Apply document title
    document.title = title;

    // Update meta tags dynamically
    const updateMeta = (nameAttr: string, contentVal: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${nameAttr}"]` : `meta[name="${nameAttr}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', nameAttr);
        } else {
          element.setAttribute('name', nameAttr);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentVal);
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:url', canonicalUrl, true);
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update JSON-LD Script
    let jsonLdScript = document.getElementById('dynamic-jsonld-schema') as HTMLScriptElement;
    if (jsonLdData) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'dynamic-jsonld-schema';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.text = JSON.stringify(jsonLdData);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

  }, [activeTab, selectedUserId, activeCategoryFilter, users, posts, currentUser]);

  return null;
};
