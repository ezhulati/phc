/**
 * GraphQL Queries for WordPress Menus
 */

import { fetchGraphQL } from '../client';
import type { WPMenu, MenuItem, MenuResponse, MenusResponse } from '../types';

const GET_ALL_MENUS_QUERY = `
  query GetAllMenus {
    menus {
      nodes {
        id
        name
        menuItems {
          nodes {
            id
            label
            url
            target
            cssClasses
            parentId
          }
        }
      }
    }
  }
`;

const GET_MENU_BY_LOCATION_QUERY = `
  query GetMenuByLocation($location: MenuLocationEnum!) {
    menu(id: $location, idType: LOCATION) {
      id
      name
      menuItems(first: 100) {
        nodes {
          id
          label
          url
          target
          cssClasses
          parentId
        }
      }
    }
  }
`;

const GET_MENU_BY_NAME_QUERY = `
  query GetMenuByName($name: ID!) {
    menu(id: $name, idType: NAME) {
      id
      name
      menuItems(first: 100, where: { parentId: "0" }) {
        nodes {
          id
          label
          url
          target
          cssClasses
          parentId
          childItems {
            nodes {
              id
              label
              url
              target
              cssClasses
              parentId
              childItems {
                nodes {
                  id
                  label
                  url
                  target
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch all menus
 */
export async function getAllMenus(): Promise<WPMenu[]> {
  const data = await fetchGraphQL<MenusResponse>(GET_ALL_MENUS_QUERY);
  return data.menus.nodes;
}

/**
 * Fetch menu by location (PRIMARY, FOOTER, etc.)
 */
export async function getMenuByLocation(location: string): Promise<WPMenu | null> {
  try {
    const data = await fetchGraphQL<{ menu: WPMenu | null }>(GET_MENU_BY_LOCATION_QUERY, { location });
    return data.menu;
  } catch (error) {
    console.error('Error fetching menu by location:', error);
    return null;
  }
}

/**
 * Fetch menu by name
 */
export async function getMenuByName(name: string): Promise<WPMenu | null> {
  try {
    const data = await fetchGraphQL<{ menu: WPMenu | null }>(GET_MENU_BY_NAME_QUERY, { name });
    return data.menu;
  } catch (error) {
    console.error('Error fetching menu by name:', error);
    return null;
  }
}

/**
 * Build nested menu structure from flat menu items
 */
export function buildMenuTree(items: MenuItem[]): MenuItem[] {
  const itemMap = new Map<string, MenuItem>();
  const rootItems: MenuItem[] = [];

  // First pass: create a map of all items
  for (const item of items) {
    itemMap.set(item.id, { ...item, childItems: { nodes: [] } });
  }

  // Second pass: build the tree
  for (const item of items) {
    const mappedItem = itemMap.get(item.id)!;

    if (item.parentId && itemMap.has(item.parentId)) {
      const parent = itemMap.get(item.parentId)!;
      parent.childItems!.nodes.push(mappedItem);
    } else {
      rootItems.push(mappedItem);
    }
  }

  return rootItems;
}

/**
 * Convert WordPress menu URL to relative path
 */
export function normalizeMenuUrl(url: string, siteUrl = 'https://prosperahealthcare.com'): string {
  // Remove site URL to get relative path
  if (url.startsWith(siteUrl)) {
    return url.replace(siteUrl, '') || '/';
  }
  // Keep external URLs as-is
  if (url.startsWith('http')) {
    return url;
  }
  // Already relative
  return url.startsWith('/') ? url : `/${url}`;
}

/**
 * Get primary navigation menu
 */
export async function getPrimaryMenu(): Promise<MenuItem[]> {
  // Try common menu names
  const menuNames = ['Primary', 'Main Menu', 'Header Menu', 'Main'];

  for (const name of menuNames) {
    const menu = await getMenuByName(name);
    if (menu && menu.menuItems.nodes.length > 0) {
      return menu.menuItems.nodes;
    }
  }

  // Fallback to location
  const menu = await getMenuByLocation('PRIMARY');
  return menu?.menuItems.nodes || [];
}

/**
 * Get footer menu
 */
export async function getFooterMenu(): Promise<MenuItem[]> {
  const menuNames = ['Footer', 'Footer Menu'];

  for (const name of menuNames) {
    const menu = await getMenuByName(name);
    if (menu && menu.menuItems.nodes.length > 0) {
      return menu.menuItems.nodes;
    }
  }

  const menu = await getMenuByLocation('FOOTER');
  return menu?.menuItems.nodes || [];
}
