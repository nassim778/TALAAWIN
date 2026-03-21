// Each location has a bounding box [west, south, east, north]
// region: 'world' for worldwide, 'tunisia' for Tunisia-only challenge.
// All locations verified to have Mapillary street-level imagery.

const LOCATIONS = [
  // ═══════════════════════════════════════════
  //  TUNISIA  (105 verified locations)
  // ═══════════════════════════════════════════

  // ── Greater Tunis ──
  { name: 'Tunis Medina', country: 'Tunisia', region: 'tunisia', bbox: [10.15, 36.79, 10.19, 36.82] },
  { name: 'Tunis Lac', country: 'Tunisia', region: 'tunisia', bbox: [10.19, 36.81, 10.25, 36.85] },
  { name: 'Tunis Belvédère', country: 'Tunisia', region: 'tunisia', bbox: [10.16, 36.81, 10.21, 36.84] },
  { name: 'La Marsa', country: 'Tunisia', region: 'tunisia', bbox: [10.30, 36.85, 10.36, 36.91] },
  { name: 'Sidi Bou Said', country: 'Tunisia', region: 'tunisia', bbox: [10.33, 36.85, 10.38, 36.90] },
  { name: 'Carthage', country: 'Tunisia', region: 'tunisia', bbox: [10.30, 36.82, 10.36, 36.88] },
  { name: 'Ariana', country: 'Tunisia', region: 'tunisia', bbox: [10.16, 36.83, 10.22, 36.89] },
  { name: 'Ben Arous', country: 'Tunisia', region: 'tunisia', bbox: [10.20, 36.72, 10.26, 36.78] },
  { name: 'La Goulette', country: 'Tunisia', region: 'tunisia', bbox: [10.28, 36.79, 10.34, 36.85] },
  { name: 'Le Bardo', country: 'Tunisia', region: 'tunisia', bbox: [10.11, 36.78, 10.17, 36.84] },
  { name: 'Manouba', country: 'Tunisia', region: 'tunisia', bbox: [10.07, 36.78, 10.13, 36.84] },
  { name: 'Radès', country: 'Tunisia', region: 'tunisia', bbox: [10.25, 36.74, 10.31, 36.80] },
  { name: 'La Soukra', country: 'Tunisia', region: 'tunisia', bbox: [10.19, 36.83, 10.25, 36.89] },
  { name: 'Mornag', country: 'Tunisia', region: 'tunisia', bbox: [10.25, 36.66, 10.31, 36.72] },
  { name: 'El Mourouj', country: 'Tunisia', region: 'tunisia', bbox: [10.17, 36.71, 10.23, 36.77] },

  // ── Bizerte Governorate ──
  { name: 'Bizerte', country: 'Tunisia', region: 'tunisia', bbox: [9.85, 37.26, 9.91, 37.30] },
  { name: 'Menzel Bourguiba', country: 'Tunisia', region: 'tunisia', bbox: [9.76, 37.12, 9.82, 37.18] },
  { name: 'Ras Jebel', country: 'Tunisia', region: 'tunisia', bbox: [10.09, 37.18, 10.15, 37.24] },
  { name: 'Mateur', country: 'Tunisia', region: 'tunisia', bbox: [9.63, 37.01, 9.69, 37.07] },
  { name: 'Rafraf', country: 'Tunisia', region: 'tunisia', bbox: [10.15, 37.16, 10.21, 37.22] },
  { name: 'Sejnane', country: 'Tunisia', region: 'tunisia', bbox: [9.21, 37.03, 9.27, 37.09] },

  // ── Béja Governorate ──
  { name: 'Béja', country: 'Tunisia', region: 'tunisia', bbox: [9.16, 36.70, 9.22, 36.76] },
  { name: 'Nefza', country: 'Tunisia', region: 'tunisia', bbox: [9.05, 36.94, 9.11, 37.00] },
  { name: 'Oued Zarga', country: 'Tunisia', region: 'tunisia', bbox: [9.38, 36.65, 9.44, 36.71] },
  { name: 'Amdoun', country: 'Tunisia', region: 'tunisia', bbox: [9.02, 36.74, 9.10, 36.80] },

  // ── Jendouba Governorate ──
  { name: 'Tabarka', country: 'Tunisia', region: 'tunisia', bbox: [8.73, 36.92, 8.79, 36.98] },
  { name: 'Aïn Draham', country: 'Tunisia', region: 'tunisia', bbox: [8.66, 36.75, 8.72, 36.81] },
  { name: 'Fernana', country: 'Tunisia', region: 'tunisia', bbox: [8.67, 36.63, 8.73, 36.69] },
  { name: 'Bou Salem', country: 'Tunisia', region: 'tunisia', bbox: [8.94, 36.59, 9.00, 36.65] },

  // ── Le Kef Governorate ──
  { name: 'Le Kef', country: 'Tunisia', region: 'tunisia', bbox: [8.68, 36.14, 8.74, 36.20] },
  { name: 'Le Kef South', country: 'Tunisia', region: 'tunisia', bbox: [8.68, 36.10, 8.76, 36.17] },

  // ── Siliana Governorate ──
  { name: 'Siliana', country: 'Tunisia', region: 'tunisia', bbox: [9.34, 36.05, 9.40, 36.11] },
  { name: 'Bargou', country: 'Tunisia', region: 'tunisia', bbox: [9.53, 36.08, 9.59, 36.14] },

  // ── Zaghouan Governorate ──
  { name: 'Zaghouan', country: 'Tunisia', region: 'tunisia', bbox: [10.11, 36.37, 10.17, 36.43] },
  { name: 'El Fahs', country: 'Tunisia', region: 'tunisia', bbox: [9.86, 36.32, 9.96, 36.40] },
  { name: 'Nadhour', country: 'Tunisia', region: 'tunisia', bbox: [10.14, 36.28, 10.22, 36.34] },
  { name: 'Mograne', country: 'Tunisia', region: 'tunisia', bbox: [9.95, 36.46, 10.05, 36.52] },

  // ── Nabeul / Cap Bon ──
  { name: 'Nabeul', country: 'Tunisia', region: 'tunisia', bbox: [10.71, 36.42, 10.77, 36.48] },
  { name: 'Hammamet', country: 'Tunisia', region: 'tunisia', bbox: [10.58, 36.37, 10.64, 36.43] },
  { name: 'Kelibia', country: 'Tunisia', region: 'tunisia', bbox: [11.07, 36.82, 11.13, 36.88] },
  { name: 'Korba', country: 'Tunisia', region: 'tunisia', bbox: [10.83, 36.55, 10.89, 36.61] },
  { name: 'Menzel Temime', country: 'Tunisia', region: 'tunisia', bbox: [10.96, 36.75, 11.02, 36.81] },
  { name: 'Beni Khiar', country: 'Tunisia', region: 'tunisia', bbox: [10.75, 36.44, 10.81, 36.50] },
  { name: 'El Haouaria', country: 'Tunisia', region: 'tunisia', bbox: [10.98, 37.03, 11.04, 37.09] },
  { name: 'Grombalia', country: 'Tunisia', region: 'tunisia', bbox: [10.47, 36.57, 10.53, 36.63] },
  { name: 'Korbus', country: 'Tunisia', region: 'tunisia', bbox: [10.55, 36.79, 10.61, 36.85] },

  // ── Sousse Governorate ──
  { name: 'Sousse', country: 'Tunisia', region: 'tunisia', bbox: [10.58, 35.80, 10.64, 35.86] },
  { name: 'Msaken', country: 'Tunisia', region: 'tunisia', bbox: [10.55, 35.70, 10.61, 35.76] },
  { name: 'Akouda', country: 'Tunisia', region: 'tunisia', bbox: [10.54, 35.84, 10.60, 35.90] },
  { name: 'Kalaa Kebira', country: 'Tunisia', region: 'tunisia', bbox: [10.50, 35.84, 10.56, 35.90] },
  { name: 'Hammam Sousse', country: 'Tunisia', region: 'tunisia', bbox: [10.57, 35.83, 10.63, 35.89] },
  { name: 'Sidi Bou Ali', country: 'Tunisia', region: 'tunisia', bbox: [10.44, 35.92, 10.50, 35.98] },
  { name: 'Port El Kantaoui', country: 'Tunisia', region: 'tunisia', bbox: [10.57, 35.86, 10.63, 35.92] },
  { name: 'Enfida', country: 'Tunisia', region: 'tunisia', bbox: [10.35, 36.11, 10.41, 36.17] },

  // ── Monastir Governorate ──
  { name: 'Monastir', country: 'Tunisia', region: 'tunisia', bbox: [10.80, 35.75, 10.86, 35.81] },
  { name: 'Moknine', country: 'Tunisia', region: 'tunisia', bbox: [10.87, 35.60, 10.93, 35.66] },
  { name: 'Ksar Hellal', country: 'Tunisia', region: 'tunisia', bbox: [10.86, 35.62, 10.92, 35.68] },
  { name: 'Teboulba', country: 'Tunisia', region: 'tunisia', bbox: [10.92, 35.64, 10.98, 35.70] },
  { name: 'Bekalta', country: 'Tunisia', region: 'tunisia', bbox: [10.97, 35.59, 11.03, 35.65] },
  { name: 'Sahline', country: 'Tunisia', region: 'tunisia', bbox: [10.69, 35.73, 10.75, 35.79] },

  // ── Mahdia Governorate ──
  { name: 'Mahdia', country: 'Tunisia', region: 'tunisia', bbox: [11.03, 35.47, 11.09, 35.53] },
  { name: 'Mahdia North', country: 'Tunisia', region: 'tunisia', bbox: [11.01, 35.50, 11.11, 35.56] },
  { name: 'El Jem', country: 'Tunisia', region: 'tunisia', bbox: [10.66, 35.26, 10.76, 35.34] },
  { name: 'Ksour Essef', country: 'Tunisia', region: 'tunisia', bbox: [10.96, 35.39, 11.02, 35.45] },
  { name: 'Bou Merdes', country: 'Tunisia', region: 'tunisia', bbox: [10.90, 35.40, 10.98, 35.46] },
  { name: 'Souassi', country: 'Tunisia', region: 'tunisia', bbox: [10.52, 35.35, 10.60, 35.41] },

  // ── Kairouan Governorate ──
  { name: 'Kairouan', country: 'Tunisia', region: 'tunisia', bbox: [10.07, 35.65, 10.13, 35.71] },
  { name: 'Sbikha', country: 'Tunisia', region: 'tunisia', bbox: [9.98, 35.90, 10.04, 35.96] },

  // ── Sfax Governorate ──
  { name: 'Sfax', country: 'Tunisia', region: 'tunisia', bbox: [10.71, 34.70, 10.81, 34.78] },
  { name: 'Sfax Medina', country: 'Tunisia', region: 'tunisia', bbox: [10.75, 34.72, 10.78, 34.76] },
  { name: 'Sakiet Ezzit', country: 'Tunisia', region: 'tunisia', bbox: [10.69, 34.74, 10.75, 34.80] },
  { name: 'Kerkennah', country: 'Tunisia', region: 'tunisia', bbox: [11.14, 34.66, 11.20, 34.72] },
  { name: 'Thyna', country: 'Tunisia', region: 'tunisia', bbox: [10.68, 34.64, 10.74, 34.70] },
  { name: 'Agareb', country: 'Tunisia', region: 'tunisia', bbox: [10.62, 34.74, 10.70, 34.80] },
  { name: 'Mahares', country: 'Tunisia', region: 'tunisia', bbox: [10.47, 34.51, 10.55, 34.57] },

  // ── Kasserine Governorate ──
  { name: 'Sbeitla', country: 'Tunisia', region: 'tunisia', bbox: [9.10, 35.20, 9.16, 35.26] },
  { name: 'Sbiba', country: 'Tunisia', region: 'tunisia', bbox: [9.04, 35.51, 9.12, 35.57] },

  // ── Sidi Bouzid Governorate ──
  { name: 'Sidi Bouzid', country: 'Tunisia', region: 'tunisia', bbox: [9.46, 35.01, 9.52, 35.07] },
  { name: 'Regueb', country: 'Tunisia', region: 'tunisia', bbox: [9.76, 34.83, 9.82, 34.89] },
  { name: 'Jelma', country: 'Tunisia', region: 'tunisia', bbox: [9.40, 35.24, 9.46, 35.30] },

  // ── Gabès Governorate ──
  { name: 'Gabès', country: 'Tunisia', region: 'tunisia', bbox: [10.07, 33.85, 10.13, 33.91] },
  { name: 'Gabès North', country: 'Tunisia', region: 'tunisia', bbox: [10.06, 33.90, 10.16, 33.98] },
  { name: 'El Hamma', country: 'Tunisia', region: 'tunisia', bbox: [9.77, 33.86, 9.83, 33.92] },
  { name: 'Mareth', country: 'Tunisia', region: 'tunisia', bbox: [10.25, 33.60, 10.31, 33.66] },
  { name: 'Chenini Nahal', country: 'Tunisia', region: 'tunisia', bbox: [10.08, 33.78, 10.16, 33.84] },

  // ── Medenine Governorate ──
  { name: 'Ben Gardane', country: 'Tunisia', region: 'tunisia', bbox: [11.19, 33.11, 11.25, 33.17] },
  { name: 'Zarzis', country: 'Tunisia', region: 'tunisia', bbox: [11.08, 33.47, 11.14, 33.53] },
  { name: 'Zarzis North', country: 'Tunisia', region: 'tunisia', bbox: [11.06, 33.52, 11.16, 33.58] },
  { name: 'Metameur', country: 'Tunisia', region: 'tunisia', bbox: [10.36, 33.38, 10.44, 33.44] },

  // ── Tataouine Governorate ──
  { name: 'Tataouine', country: 'Tunisia', region: 'tunisia', bbox: [10.42, 32.90, 10.48, 32.96] },
  { name: 'Ghomrassen', country: 'Tunisia', region: 'tunisia', bbox: [10.31, 33.03, 10.37, 33.09] },
  { name: 'Chenini', country: 'Tunisia', region: 'tunisia', bbox: [10.23, 32.89, 10.29, 32.95] },

  // ── Djerba ──
  { name: 'Houmt Souk', country: 'Tunisia', region: 'tunisia', bbox: [10.83, 33.84, 10.89, 33.90] },
  { name: 'Midoun', country: 'Tunisia', region: 'tunisia', bbox: [10.96, 33.77, 11.02, 33.83] },
  { name: 'Guellala', country: 'Tunisia', region: 'tunisia', bbox: [10.89, 33.72, 10.95, 33.78] },

  // ── Gafsa Governorate ──
  { name: 'Gafsa', country: 'Tunisia', region: 'tunisia', bbox: [8.75, 34.39, 8.81, 34.45] },
  { name: 'Metlaoui', country: 'Tunisia', region: 'tunisia', bbox: [8.37, 34.29, 8.43, 34.35] },
  { name: 'El Guettar', country: 'Tunisia', region: 'tunisia', bbox: [8.92, 34.30, 8.98, 34.36] },

  // ── Tozeur Governorate ──
  { name: 'Tozeur', country: 'Tunisia', region: 'tunisia', bbox: [8.10, 33.89, 8.16, 33.95] },
  { name: 'Chebika', country: 'Tunisia', region: 'tunisia', bbox: [7.90, 34.29, 7.96, 34.35] },
  { name: 'Degache', country: 'Tunisia', region: 'tunisia', bbox: [8.18, 33.96, 8.26, 34.02] },

  // ── Kebili Governorate ──
  { name: 'Kebili', country: 'Tunisia', region: 'tunisia', bbox: [8.94, 33.67, 9.00, 33.73] },
  { name: 'Douz', country: 'Tunisia', region: 'tunisia', bbox: [8.99, 33.43, 9.05, 33.49] },
  { name: 'Jemna', country: 'Tunisia', region: 'tunisia', bbox: [8.97, 33.57, 9.05, 33.63] },

  // ── Other ──
  { name: 'Kalaat el-Andalous', country: 'Tunisia', region: 'tunisia', bbox: [10.06, 37.03, 10.12, 37.09] },

  // ═══════════════════════════════════════════
  //  ALGERIA  (20 verified locations)
  // ═══════════════════════════════════════════
  { name: 'Algiers', country: 'Algeria', region: 'maghreb', bbox: [3.04, 36.74, 3.10, 36.80] },
  { name: 'Oran', country: 'Algeria', region: 'maghreb', bbox: [-0.66, 35.68, -0.60, 35.74] },
  { name: 'Constantine', country: 'Algeria', region: 'maghreb', bbox: [6.58, 36.33, 6.64, 36.39] },
  { name: 'Annaba', country: 'Algeria', region: 'maghreb', bbox: [7.74, 36.88, 7.80, 36.94] },
  { name: 'Blida', country: 'Algeria', region: 'maghreb', bbox: [2.82, 36.45, 2.88, 36.51] },
  { name: 'Batna', country: 'Algeria', region: 'maghreb', bbox: [6.15, 35.53, 6.21, 35.59] },
  { name: 'Biskra', country: 'Algeria', region: 'maghreb', bbox: [5.70, 34.82, 5.76, 34.88] },
  { name: 'Tlemcen', country: 'Algeria', region: 'maghreb', bbox: [-1.34, 34.86, -1.28, 34.92] },
  { name: 'Béjaïa', country: 'Algeria', region: 'maghreb', bbox: [5.06, 36.73, 5.12, 36.79] },
  { name: 'Tizi Ouzou', country: 'Algeria', region: 'maghreb', bbox: [4.02, 36.69, 4.08, 36.75] },
  { name: 'Ouargla', country: 'Algeria', region: 'maghreb', bbox: [5.30, 31.93, 5.36, 31.99] },
  { name: 'Ghardaïa', country: 'Algeria', region: 'maghreb', bbox: [3.65, 32.47, 3.71, 32.53] },
  { name: 'Mostaganem', country: 'Algeria', region: 'maghreb', bbox: [0.06, 35.91, 0.12, 35.97] },
  { name: 'Jijel', country: 'Algeria', region: 'maghreb', bbox: [5.75, 36.78, 5.81, 36.84] },
  { name: 'El Oued', country: 'Algeria', region: 'maghreb', bbox: [6.85, 33.35, 6.91, 33.41] },
  { name: 'Bouira', country: 'Algeria', region: 'maghreb', bbox: [3.87, 36.35, 3.93, 36.41] },
  { name: 'Sidi Bel Abbes', country: 'Algeria', region: 'maghreb', bbox: [-0.66, 35.17, -0.60, 35.23] },
  { name: 'Tipaza', country: 'Algeria', region: 'maghreb', bbox: [2.42, 36.57, 2.48, 36.63] },
  { name: 'Tamanghasset', country: 'Algeria', region: 'maghreb', bbox: [5.50, 22.76, 5.56, 22.82] },
  { name: 'Laghouat', country: 'Algeria', region: 'maghreb', bbox: [2.85, 33.77, 2.91, 33.83] },

  // ═══════════════════════════════════════════
  //  LIBYA  (20 verified locations)
  // ═══════════════════════════════════════════
  { name: 'Tripoli', country: 'Libya', region: 'maghreb', bbox: [13.15, 32.87, 13.21, 32.93] },
  { name: 'Benghazi', country: 'Libya', region: 'maghreb', bbox: [20.05, 32.08, 20.11, 32.14] },
  { name: 'Misrata', country: 'Libya', region: 'maghreb', bbox: [15.06, 32.35, 15.12, 32.41] },
  { name: 'Zawiya', country: 'Libya', region: 'maghreb', bbox: [12.70, 32.73, 12.76, 32.79] },
  { name: 'Sabha', country: 'Libya', region: 'maghreb', bbox: [14.40, 27.01, 14.46, 27.07] },
  { name: 'Sabratha', country: 'Libya', region: 'maghreb', bbox: [12.47, 32.76, 12.53, 32.82] },
  { name: 'Zuwarah', country: 'Libya', region: 'maghreb', bbox: [12.07, 32.91, 12.13, 32.97] },
  { name: 'Tajura', country: 'Libya', region: 'maghreb', bbox: [13.33, 32.85, 13.39, 32.91] },
  { name: 'Janzour', country: 'Libya', region: 'maghreb', bbox: [13.04, 32.83, 13.10, 32.89] },
  { name: 'Surman', country: 'Libya', region: 'maghreb', bbox: [12.56, 32.73, 12.62, 32.79] },
  { name: 'Tripoli South', country: 'Libya', region: 'maghreb', bbox: [13.17, 32.82, 13.23, 32.88] },
  { name: 'Tripoli East', country: 'Libya', region: 'maghreb', bbox: [13.22, 32.88, 13.28, 32.94] },
  { name: 'Misrata South', country: 'Libya', region: 'maghreb', bbox: [15.04, 32.30, 15.10, 32.36] },
  { name: 'Tripoli Hay Andalus', country: 'Libya', region: 'maghreb', bbox: [13.12, 32.84, 13.18, 32.90] },
  { name: 'Tripoli Airport', country: 'Libya', region: 'maghreb', bbox: [13.27, 32.88, 13.33, 32.94] },
  { name: 'Ain Zara', country: 'Libya', region: 'maghreb', bbox: [13.20, 32.83, 13.26, 32.89] },
  { name: 'Benghazi East', country: 'Libya', region: 'maghreb', bbox: [20.08, 32.10, 20.14, 32.16] },
  { name: 'Benghazi Port', country: 'Libya', region: 'maghreb', bbox: [20.04, 32.10, 20.10, 32.16] },
  { name: 'Misrata East', country: 'Libya', region: 'maghreb', bbox: [15.10, 32.34, 15.16, 32.40] },
  { name: 'Tripoli Gargaresh', country: 'Libya', region: 'maghreb', bbox: [13.09, 32.87, 13.15, 32.93] },

  // ═══════════════════════════════════════════
  //  MOROCCO  (20 verified locations)
  // ═══════════════════════════════════════════
  { name: 'Rabat', country: 'Morocco', region: 'maghreb', bbox: [-6.86, 33.97, -6.80, 34.03] },
  { name: 'Marrakech', country: 'Morocco', region: 'maghreb', bbox: [-8.03, 31.60, -7.97, 31.66] },
  { name: 'Fes', country: 'Morocco', region: 'maghreb', bbox: [-5.02, 34.01, -4.96, 34.07] },
  { name: 'Tangier', country: 'Morocco', region: 'maghreb', bbox: [-5.83, 35.74, -5.77, 35.80] },
  { name: 'Agadir', country: 'Morocco', region: 'maghreb', bbox: [-9.62, 30.40, -9.56, 30.46] },
  { name: 'Meknes', country: 'Morocco', region: 'maghreb', bbox: [-5.57, 33.87, -5.51, 33.93] },
  { name: 'Kenitra', country: 'Morocco', region: 'maghreb', bbox: [-6.60, 34.25, -6.54, 34.31] },
  { name: 'Tetouan', country: 'Morocco', region: 'maghreb', bbox: [-5.39, 35.55, -5.33, 35.61] },
  { name: 'El Jadida', country: 'Morocco', region: 'maghreb', bbox: [-8.53, 33.23, -8.47, 33.29] },
  { name: 'Nador', country: 'Morocco', region: 'maghreb', bbox: [-2.96, 35.16, -2.90, 35.22] },
  { name: 'Taza', country: 'Morocco', region: 'maghreb', bbox: [-4.03, 34.19, -3.97, 34.25] },
  { name: 'Essaouira', country: 'Morocco', region: 'maghreb', bbox: [-9.80, 31.49, -9.74, 31.55] },
  { name: 'Larache', country: 'Morocco', region: 'maghreb', bbox: [-6.17, 35.17, -6.11, 35.23] },
  { name: 'Settat', country: 'Morocco', region: 'maghreb', bbox: [-7.65, 33.00, -7.59, 33.06] },
  { name: 'Mohammedia', country: 'Morocco', region: 'maghreb', bbox: [-7.41, 33.67, -7.35, 33.73] },
  { name: 'Chefchaouen', country: 'Morocco', region: 'maghreb', bbox: [-5.28, 35.15, -5.22, 35.21] },
  { name: 'Ouarzazate', country: 'Morocco', region: 'maghreb', bbox: [-6.93, 30.89, -6.87, 30.95] },
  { name: 'Errachidia', country: 'Morocco', region: 'maghreb', bbox: [-4.46, 31.91, -4.40, 31.97] },
  { name: 'Dakhla', country: 'Morocco', region: 'maghreb', bbox: [-15.98, 23.69, -15.92, 23.75] },
  { name: 'Laayoune', country: 'Morocco', region: 'maghreb', bbox: [-13.23, 27.12, -13.17, 27.18] },

  // ═══════════════════════════════════════════
  //  MAURITANIA  (20 verified locations)
  // ═══════════════════════════════════════════
  { name: 'Kaédi', country: 'Mauritania', region: 'maghreb', bbox: [-13.53, 16.13, -13.47, 16.19] },
  { name: 'Rosso', country: 'Mauritania', region: 'maghreb', bbox: [-15.83, 16.49, -15.77, 16.55] },
  { name: 'Zouérat', country: 'Mauritania', region: 'maghreb', bbox: [-12.50, 22.71, -12.44, 22.77] },
  { name: 'Boghé', country: 'Mauritania', region: 'maghreb', bbox: [-14.30, 16.57, -14.24, 16.63] },
  { name: 'Boutilimit', country: 'Mauritania', region: 'maghreb', bbox: [-14.72, 17.52, -14.66, 17.58] },
  { name: 'Nouakchott South', country: 'Mauritania', region: 'maghreb', bbox: [-15.99, 18.00, -15.93, 18.06] },
  { name: 'Nouakchott Center', country: 'Mauritania', region: 'maghreb', bbox: [-15.96, 18.08, -15.90, 18.14] },
  { name: 'Nouakchott East', country: 'Mauritania', region: 'maghreb', bbox: [-15.93, 18.07, -15.87, 18.13] },
  { name: 'Nouakchott Toujounine', country: 'Mauritania', region: 'maghreb', bbox: [-15.91, 18.08, -15.85, 18.14] },
  { name: 'Nouakchott Sebkha', country: 'Mauritania', region: 'maghreb', bbox: [-16.00, 18.06, -15.94, 18.12] },
  { name: 'Nouakchott Riyad', country: 'Mauritania', region: 'maghreb', bbox: [-15.95, 18.06, -15.89, 18.12] },
  { name: 'Kaédi South', country: 'Mauritania', region: 'maghreb', bbox: [-13.52, 16.10, -13.46, 16.16] },
  { name: 'Kaédi East', country: 'Mauritania', region: 'maghreb', bbox: [-13.50, 16.13, -13.44, 16.19] },
  { name: 'Kaédi North', country: 'Mauritania', region: 'maghreb', bbox: [-13.54, 16.16, -13.48, 16.22] },
  { name: 'Rosso East', country: 'Mauritania', region: 'maghreb', bbox: [-15.80, 16.49, -15.74, 16.55] },
  { name: 'Rosso North', country: 'Mauritania', region: 'maghreb', bbox: [-15.84, 16.52, -15.78, 16.58] },
  { name: 'Boghé East', country: 'Mauritania', region: 'maghreb', bbox: [-14.27, 16.57, -14.21, 16.63] },
  { name: 'Boghé North', country: 'Mauritania', region: 'maghreb', bbox: [-14.31, 16.60, -14.25, 16.66] },
  { name: 'Aleg South', country: 'Mauritania', region: 'maghreb', bbox: [-13.93, 17.00, -13.87, 17.06] },
  { name: 'Zouérat East', country: 'Mauritania', region: 'maghreb', bbox: [-12.47, 22.71, -12.41, 22.77] },

  // ═══════════════════════════════════════════
  //  EGYPT  (20 verified locations)
  // ═══════════════════════════════════════════
  { name: 'Cairo', country: 'Egypt', region: 'maghreb', bbox: [31.22, 30.03, 31.28, 30.07] },
  { name: 'Alexandria', country: 'Egypt', region: 'maghreb', bbox: [29.90, 31.18, 29.96, 31.24] },
  { name: 'Giza', country: 'Egypt', region: 'maghreb', bbox: [31.19, 29.98, 31.25, 30.04] },
  { name: 'Luxor', country: 'Egypt', region: 'maghreb', bbox: [32.62, 25.67, 32.68, 25.73] },
  { name: 'Aswan', country: 'Egypt', region: 'maghreb', bbox: [32.87, 24.05, 32.93, 24.11] },
  { name: 'Ismailia', country: 'Egypt', region: 'maghreb', bbox: [32.26, 30.57, 32.32, 30.63] },
  { name: 'Hurghada', country: 'Egypt', region: 'maghreb', bbox: [33.83, 27.17, 33.89, 27.23] },
  { name: 'Sharm El Sheikh', country: 'Egypt', region: 'maghreb', bbox: [34.31, 27.90, 34.37, 27.96] },
  { name: 'Fayoum', country: 'Egypt', region: 'maghreb', bbox: [30.82, 29.28, 30.88, 29.34] },
  { name: 'Zagazig', country: 'Egypt', region: 'maghreb', bbox: [31.49, 30.56, 31.55, 30.62] },
  { name: 'Beni Suef', country: 'Egypt', region: 'maghreb', bbox: [31.07, 29.04, 31.13, 29.10] },
  { name: 'Qena', country: 'Egypt', region: 'maghreb', bbox: [32.70, 26.14, 32.76, 26.20] },
  { name: '6th October', country: 'Egypt', region: 'maghreb', bbox: [30.88, 29.94, 30.94, 30.00] },
  { name: 'Helwan', country: 'Egypt', region: 'maghreb', bbox: [31.32, 29.82, 31.38, 29.88] },
  { name: 'Nasr City', country: 'Egypt', region: 'maghreb', bbox: [31.32, 30.04, 31.38, 30.10] },
  { name: 'Damietta', country: 'Egypt', region: 'maghreb', bbox: [31.78, 31.40, 31.84, 31.46] },
  { name: 'Marsa Matruh', country: 'Egypt', region: 'maghreb', bbox: [27.22, 31.33, 27.28, 31.39] },
  { name: 'Banha', country: 'Egypt', region: 'maghreb', bbox: [31.15, 30.44, 31.21, 30.50] },
  { name: 'Mit Ghamr', country: 'Egypt', region: 'maghreb', bbox: [31.23, 30.69, 31.29, 30.75] },
  { name: 'El Obour', country: 'Egypt', region: 'maghreb', bbox: [31.44, 30.21, 31.50, 30.27] },

  // ═══════════════════════════════════════════
  //  WORLDWIDE  (32 verified locations)
  // ═══════════════════════════════════════════

  // North America
  { name: 'San Francisco', country: 'USA', region: 'world', bbox: [-122.43, 37.76, -122.39, 37.80] },
  { name: 'Toronto', country: 'Canada', region: 'world', bbox: [-79.41, 43.64, -79.35, 43.68] },
  { name: 'Washington DC', country: 'USA', region: 'world', bbox: [-77.05, 38.88, -77.01, 38.92] },
  { name: 'Miami', country: 'USA', region: 'world', bbox: [-80.22, 25.76, -80.18, 25.80] },

  // South America
  { name: 'Buenos Aires', country: 'Argentina', region: 'world', bbox: [-58.40, -34.62, -58.36, -34.58] },
  { name: 'Rio de Janeiro', country: 'Brazil', region: 'world', bbox: [-43.20, -22.93, -43.16, -22.89] },
  { name: 'São Paulo', country: 'Brazil', region: 'world', bbox: [-46.66, -23.57, -46.62, -23.53] },
  { name: 'Bogotá', country: 'Colombia', region: 'world', bbox: [-74.09, 4.60, -74.05, 4.64] },

  // Europe
  { name: 'London', country: 'UK', region: 'world', bbox: [-0.14, 51.49, -0.08, 51.53] },
  { name: 'Paris', country: 'France', region: 'world', bbox: [2.32, 48.84, 2.38, 48.88] },
  { name: 'Berlin', country: 'Germany', region: 'world', bbox: [13.37, 52.50, 13.43, 52.54] },
  { name: 'Madrid', country: 'Spain', region: 'world', bbox: [-3.72, 40.40, -3.68, 40.44] },
  { name: 'Barcelona', country: 'Spain', region: 'world', bbox: [2.15, 41.37, 2.19, 41.41] },
  { name: 'Prague', country: 'Czech Republic', region: 'world', bbox: [14.40, 50.07, 14.46, 50.11] },
  { name: 'Vienna', country: 'Austria', region: 'world', bbox: [16.35, 48.19, 16.41, 48.23] },
  { name: 'Oslo', country: 'Norway', region: 'world', bbox: [10.72, 59.90, 10.78, 59.94] },
  { name: 'Istanbul', country: 'Turkey', region: 'world', bbox: [28.96, 41.00, 29.02, 41.04] },
  { name: 'Lisbon', country: 'Portugal', region: 'world', bbox: [-9.16, 38.70, -9.10, 38.74] },
  { name: 'Brussels', country: 'Belgium', region: 'world', bbox: [4.33, 50.83, 4.39, 50.87] },
  { name: 'Zurich', country: 'Switzerland', region: 'world', bbox: [8.52, 47.36, 8.56, 47.40] },
  { name: 'Warsaw', country: 'Poland', region: 'world', bbox: [21.00, 52.22, 21.04, 52.26] },
  { name: 'Budapest', country: 'Hungary', region: 'world', bbox: [19.03, 47.48, 19.09, 47.52] },
  { name: 'Munich', country: 'Germany', region: 'world', bbox: [11.55, 48.12, 11.61, 48.16] },

  // Asia
  { name: 'Seoul', country: 'South Korea', region: 'world', bbox: [126.96, 37.54, 127.02, 37.58] },
  { name: 'Singapore', country: 'Singapore', region: 'world', bbox: [103.83, 1.28, 103.87, 1.32] },
  { name: 'Bangkok', country: 'Thailand', region: 'world', bbox: [100.49, 13.73, 100.55, 13.77] },
  { name: 'Mumbai', country: 'India', region: 'world', bbox: [72.82, 18.93, 72.88, 18.97] },
  { name: 'Taipei', country: 'Taiwan', region: 'world', bbox: [121.51, 25.03, 121.57, 25.07] },
  { name: 'Kuala Lumpur', country: 'Malaysia', region: 'world', bbox: [101.67, 3.13, 101.73, 3.17] },

  // Africa
  { name: 'Cape Town', country: 'South Africa', region: 'world', bbox: [18.40, -33.94, 18.46, -33.90] },
  { name: 'Cairo', country: 'Egypt', region: 'world', bbox: [31.22, 30.03, 31.28, 30.07] },

  // Oceania
  { name: 'Sydney', country: 'Australia', region: 'world', bbox: [151.19, -33.89, 151.25, -33.85] },
];

const TUNISIA_MAGHREB_NAMES = new Set([
  'Tunis Medina', 'La Marsa', 'Sidi Bou Said', 'Bizerte', 'Nabeul',
  'Hammamet', 'Sousse', 'Monastir', 'Mahdia', 'Sfax',
  'Kairouan', 'Gabès', 'Ben Gardane', 'Zarzis', 'Houmt Souk',
  'Gafsa', 'Tozeur', 'Douz', 'Tataouine', 'Tabarka',
]);

export function getLocations(mode) {
  if (mode === 'tunisia') {
    return LOCATIONS.filter((loc) => loc.region === 'tunisia');
  }
  if (mode === 'maghreb') {
    const tunisia20 = LOCATIONS.filter(
      (loc) => loc.region === 'tunisia' && TUNISIA_MAGHREB_NAMES.has(loc.name),
    );
    const others = LOCATIONS.filter((loc) => loc.region === 'maghreb');
    return [...tunisia20, ...others];
  }
  return LOCATIONS.filter((loc) => loc.region === 'world');
}

export default LOCATIONS;
