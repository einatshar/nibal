(function($) {window.fnames = new Array(); window.ftypes = new Array();fnames[0]='EMAIL';ftypes[0]='email';fnames[1]='FNAME';ftypes[1]='text';fnames[2]='LNAME';ftypes[2]='text';fnames[3]='MMERGE3';ftypes[3]='text';fnames[21]='MMERGE21';ftypes[21]='text';fnames[20]='MMERGE20';ftypes[20]='text';fnames[19]='MMERGE19';ftypes[19]='text';fnames[18]='MMERGE18';ftypes[18]='text';fnames[17]='MMERGE17';ftypes[17]='text';fnames[16]='MMERGE16';ftypes[16]='text';fnames[15]='MMERGE15';ftypes[15]='text';fnames[14]='MMERGE14';ftypes[14]='text';fnames[12]='MMERGE12';ftypes[12]='date';fnames[13]='MMERGE13';ftypes[13]='number';fnames[11]='MMERGE11';ftypes[11]='number';fnames[10]='MMERGE10';ftypes[10]='number';fnames[8]='MMERGE8';ftypes[8]='number';fnames[9]='ZIPPOSTALC';ftypes[9]='text';fnames[7]='PRIMARYSTA';ftypes[7]='text';fnames[6]='PRIMARYSTR';ftypes[6]='text';fnames[5]='PRIMARYCIT';ftypes[5]='text';fnames[4]='PRIMARYCOU';ftypes[4]='text';}(jQuery));var $mcj = jQuery.noConflict(true);
    // SMS Phone Multi-Country Functionality
    if(!window.MC) {
      window.MC = {};
    }
    window.MC.smsPhoneData = {
      defaultCountryCode: 'IL',
      programs: [],
      smsProgramDataCountryNames: []
    };

    function getCountryUnicodeFlag(countryCode) {
       return countryCode.toUpperCase().replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    };

    // HTML sanitization function to prevent XSS
    function sanitizeHtml(str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }

    // URL sanitization function to prevent javascript: and data: URLs
    function sanitizeUrl(url) {
      if (typeof url !== 'string') return '';
      const trimmedUrl = url.trim().toLowerCase();
      if (trimmedUrl.startsWith('javascript:') || trimmedUrl.startsWith('data:') || trimmedUrl.startsWith('vbscript:')) {
        return '#';
      }
      return url;
    }

    const getBrowserLanguage = () => {
      if (!window?.navigator?.language?.split('-')[1]) {
        return window?.navigator?.language?.toUpperCase();
      }
      return window?.navigator?.language?.split('-')[1];
    };

    function getDefaultCountryProgram(defaultCountryCode, smsProgramData) {
      if (!smsProgramData || smsProgramData.length === 0) {
        return null;
      }

      const browserLanguage = getBrowserLanguage();

      if (browserLanguage) {
        const foundProgram = smsProgramData.find(
          (program) => program?.countryCode === browserLanguage,
        );
        if (foundProgram) {
          return foundProgram;
        }
      }

      if (defaultCountryCode) {
        const foundProgram = smsProgramData.find(
          (program) => program?.countryCode === defaultCountryCode,
        );
        if (foundProgram) {
          return foundProgram;
        }
      }

      return smsProgramData[0];
    }

    function updateSmsLegalText(countryCode, fieldName) {
      if (!countryCode || !fieldName) {
        return;
      }
      
      const programs = window?.MC?.smsPhoneData?.programs;
      if (!programs || !Array.isArray(programs)) {
        return;
      }
      
      const program = programs.find(program => program?.countryCode === countryCode);
      if (!program || !program.requiredTemplate) {
        return;
      }
      
      const legalTextElement = document.querySelector('#legal-text-' + fieldName);
      if (!legalTextElement) {
        return;
      }
      
      // Remove HTML tags and clean up the text
      const divRegex = new RegExp('</?[div][^>]*>', 'gi');
      const fullAnchorRegex = new RegExp('<a.*?</a>', 'g');
      const anchorRegex = new RegExp('<a href="(.*?)" target="(.*?)">(.*?)</a>');
      
      const requiredLegalText = program.requiredTemplate
        .replace(divRegex, '')
        .replace(fullAnchorRegex, '')
        .slice(0, -1);
      
      const anchorMatches = program.requiredTemplate.match(anchorRegex);
      
      if (anchorMatches && anchorMatches.length >= 4) {
        // Create link element safely using DOM methods instead of innerHTML
        const linkElement = document.createElement('a');
        linkElement.href = sanitizeUrl(anchorMatches[1]);
        linkElement.target = sanitizeHtml(anchorMatches[2]);
        linkElement.textContent = sanitizeHtml(anchorMatches[3]);
        
        legalTextElement.textContent = requiredLegalText + ' ';
        legalTextElement.appendChild(linkElement);
        legalTextElement.appendChild(document.createTextNode('.'));
      } else {
        legalTextElement.textContent = requiredLegalText + '.';
      }
    }

    function generateDropdownOptions(smsProgramData) {
      if (!smsProgramData || smsProgramData.length === 0) {
        return '';
      }
      
      return smsProgramData.map(program => {
        const flag = getCountryUnicodeFlag(program.countryCode);
        const countryName = getCountryName(program.countryCode);
        const callingCode = program.countryCallingCode || '';
        // Sanitize all values to prevent XSS
        const sanitizedCountryCode = sanitizeHtml(program.countryCode || '');
        const sanitizedCountryName = sanitizeHtml(countryName || '');
        const sanitizedCallingCode = sanitizeHtml(callingCode || '');
        return '<option value="' + sanitizedCountryCode + '">' + sanitizedCountryName + ' ' + sanitizedCallingCode + '</option>';
      }).join('');
    }

    function getCountryName(countryCode) {
      if (window.MC?.smsPhoneData?.smsProgramDataCountryNames && Array.isArray(window.MC.smsPhoneData.smsProgramDataCountryNames)) {
        for (let i = 0; i < window.MC.smsPhoneData.smsProgramDataCountryNames.length; i++) {
          if (window.MC.smsPhoneData.smsProgramDataCountryNames[i].code === countryCode) {
            return window.MC.smsPhoneData.smsProgramDataCountryNames[i].name;
          }
        }
      }
      return countryCode;
    }

    function getDefaultPlaceholder(countryCode) {
      if (!countryCode || typeof countryCode !== 'string') {
        return '+1 000 000 0000'; // Default US placeholder
      }
      
      const mockPlaceholders = [
        {
      countryCode: 'US',
      placeholder: '+1 000 000 0000',
      helpText: 'Include the US country code +1 before the phone number',
    },
    {
      countryCode: 'GB',
      placeholder: '+44 0000 000000',
      helpText: 'Include the GB country code +44 before the phone number',
    },
    {
      countryCode: 'CA',
      placeholder: '+1 000 000 0000',
      helpText: 'Include the CA country code +1 before the phone number',
    },
    {
      countryCode: 'AU',
      placeholder: '+61 000 000 000',
      helpText: 'Include the AU country code +61 before the phone number',
    },
    {
      countryCode: 'DE',
      placeholder: '+49 000 0000000',
      helpText: 'Fügen Sie vor der Telefonnummer die DE-Ländervorwahl +49 ein',
    },
    {
      countryCode: 'FR',
      placeholder: '+33 0 00 00 00 00',
      helpText: 'Incluez le code pays FR +33 avant le numéro de téléphone',
    },
    {
      countryCode: 'ES',
      placeholder: '+34 000 000 000',
      helpText: 'Incluya el código de país ES +34 antes del número de teléfono',
    },
    {
      countryCode: 'NL',
      placeholder: '+31 0 00000000',
      helpText: 'Voeg de NL-landcode +31 toe vóór het telefoonnummer',
    },
    {
      countryCode: 'BE',
      placeholder: '+32 000 00 00 00',
      helpText: 'Incluez le code pays BE +32 avant le numéro de téléphone',
    },
    {
      countryCode: 'CH',
      placeholder: '+41 00 000 00 00',
      helpText: 'Fügen Sie vor der Telefonnummer die CH-Ländervorwahl +41 ein',
    },
    {
      countryCode: 'AT',
      placeholder: '+43 000 000 0000',
      helpText: 'Fügen Sie vor der Telefonnummer die AT-Ländervorwahl +43 ein',
    },
    {
      countryCode: 'IE',
      placeholder: '+353 00 000 0000',
      helpText: 'Include the IE country code +353 before the phone number',
    },
    {
      countryCode: 'IT',
      placeholder: '+39 000 000 0000',
      helpText:
        'Includere il prefisso internazionale IT +39 prima del numero di telefono',
    },
      ];

      const selectedPlaceholder = mockPlaceholders.find(function(item) {
        return item && item.countryCode === countryCode;
      });
      
      return selectedPlaceholder ? selectedPlaceholder.placeholder : mockPlaceholders[0].placeholder;
    }

    function updatePlaceholder(countryCode, fieldName) {
      if (!countryCode || !fieldName) {
        return;
      }
      
      const phoneInput = document.querySelector('#mce-' + fieldName);
      if (!phoneInput) {
        return;
      }
      
      const placeholder = getDefaultPlaceholder(countryCode);
      if (placeholder) {
        phoneInput.placeholder = placeholder;
      }
    }

    function updateCountryCodeInstruction(countryCode, fieldName) {
      updatePlaceholder(countryCode, fieldName);
      
    }

    function getDefaultHelpText(countryCode) {
      const mockPlaceholders = [
        {
          countryCode: 'US',
          placeholder: '+1 000 000 0000',
          helpText: 'Include the US country code +1 before the phone number',
        },
        {
          countryCode: 'GB',
          placeholder: '+44 0000 000000',
          helpText: 'Include the GB country code +44 before the phone number',
        },
        {
          countryCode: 'CA',
          placeholder: '+1 000 000 0000',
          helpText: 'Include the CA country code +1 before the phone number',
        },
        {
          countryCode: 'AU',
          placeholder: '+61 000 000 000',
          helpText: 'Include the AU country code +61 before the phone number',
        },
        {
          countryCode: 'DE',
          placeholder: '+49 000 0000000',
          helpText: 'Fügen Sie vor der Telefonnummer die DE-Ländervorwahl +49 ein',
        },
        {
          countryCode: 'FR',
          placeholder: '+33 0 00 00 00 00',
          helpText: 'Incluez le code pays FR +33 avant le numéro de téléphone',
        },
        {
          countryCode: 'ES',
          placeholder: '+34 000 000 000',
          helpText: 'Incluya el código de país ES +34 antes del número de teléfono',
        },
        {
          countryCode: 'NL',
          placeholder: '+31 0 00000000',
          helpText: 'Voeg de NL-landcode +31 toe vóór het telefoonnummer',
        },
        {
          countryCode: 'BE',
          placeholder: '+32 000 00 00 00',
          helpText: 'Incluez le code pays BE +32 avant le numéro de téléphone',
        },
        {
          countryCode: 'CH',
          placeholder: '+41 00 000 00 00',
          helpText: 'Fügen Sie vor der Telefonnummer die CH-Ländervorwahl +41 ein',
        },
        {
          countryCode: 'AT',
          placeholder: '+43 000 000 0000',
          helpText: 'Fügen Sie vor der Telefonnummer die AT-Ländervorwahl +43 ein',
        },
        {
          countryCode: 'IE',
          placeholder: '+353 00 000 0000',
          helpText: 'Include the IE country code +353 before the phone number',
        },
        {
          countryCode: 'IT',
          placeholder: '+39 000 000 0000',
          helpText: 'Includere il prefisso internazionale IT +39 prima del numero di telefono',
        },
      ];
      
      if (!countryCode || typeof countryCode !== 'string') {
        return mockPlaceholders[0].helpText;
      }
      
      const selectedHelpText = mockPlaceholders.find(function(item) {
          return item && item.countryCode === countryCode;
        });
        
        return selectedHelpText ? selectedHelpText.helpText : mockPlaceholders[0].helpText;
    }

    function setDefaultHelpText(countryCode) {
      const helpTextSpan = document.querySelector('#help-text');
      if (!helpTextSpan) {
        return;
      }

        
    }

    function updateHelpTextCountryCode(countryCode, fieldName) {
      if (!countryCode || !fieldName) {
        return;
      }
      
      setDefaultHelpText(countryCode);
    }

    function initializeSmsPhoneDropdown(fieldName) {
      if (!fieldName || typeof fieldName !== 'string') {
        return;
      }
      
      const dropdown = document.querySelector('#country-select-' + fieldName);
      const displayFlag = document.querySelector('#flag-display-' + fieldName);
      
      if (!dropdown || !displayFlag) {
        return;
      }

      const smsPhoneData = window.MC?.smsPhoneData;
      if (smsPhoneData && smsPhoneData.programs && Array.isArray(smsPhoneData.programs)) {
        dropdown.innerHTML = generateDropdownOptions(smsPhoneData.programs);
      }

      const defaultProgram = getDefaultCountryProgram(smsPhoneData?.defaultCountryCode, smsPhoneData?.programs);
      if (defaultProgram && defaultProgram.countryCode) {
        dropdown.value = defaultProgram.countryCode;
        
        const flagSpan = displayFlag?.querySelector('#flag-emoji-' + fieldName);
        if (flagSpan) {
          flagSpan.textContent = getCountryUnicodeFlag(defaultProgram.countryCode);
          flagSpan.setAttribute('aria-label', sanitizeHtml(defaultProgram.countryCode) + ' flag');
        }
        
        updateSmsLegalText(defaultProgram.countryCode, fieldName);
        updatePlaceholder(defaultProgram.countryCode, fieldName);
        updateCountryCodeInstruction(defaultProgram.countryCode, fieldName);
      }

     
      var smsNotRequiredRemoveCountryCodeEnabled = true;
      var smsField = Object.values({"EMAIL":{"name":"EMAIL","label":"Email Address","helper_text":"","type":"email","required":true,"audience_field_name":"Email Address","merge_id":0,"help_text_enabled":false,"enabled":true,"order":"0","field_type":"merge"},"FNAME":{"name":"FNAME","label":"שם פרטי","helper_text":"","type":"text","required":false,"audience_field_name":"First Name","merge_id":1,"help_text_enabled":false,"enabled":true,"order":"1","field_type":"merge"},"LNAME":{"name":"LNAME","label":"שם משפחה","helper_text":"","type":"text","required":false,"audience_field_name":"Last Name","merge_id":2,"help_text_enabled":false,"enabled":true,"order":"2","field_type":"merge"},"MMERGE3":{"name":"MMERGE3","label":"Newsletter - English","helper_text":"","type":"text","required":false,"audience_field_name":"Newsletter - English","enabled":false,"order":null,"field_type":"merge","merge_id":3},"MMERGE21":{"name":"MMERGE21","label":"International Media","helper_text":"","type":"text","required":false,"audience_field_name":"International Media","enabled":false,"order":null,"field_type":"merge","merge_id":21},"MMERGE20":{"name":"MMERGE20","label":"UN ISR-PAL","helper_text":"","type":"text","required":false,"audience_field_name":"UN ISR-PAL","enabled":false,"order":null,"field_type":"merge","merge_id":20},"MMERGE19":{"name":"MMERGE19","label":"Dip-Consulates","helper_text":"","type":"text","required":false,"audience_field_name":"Dip-Consulates","enabled":false,"order":null,"field_type":"merge","merge_id":19},"MMERGE18":{"name":"MMERGE18","label":"Dip-Embassies","helper_text":"","type":"text","required":false,"audience_field_name":"Dip-Embassies","enabled":false,"order":null,"field_type":"merge","merge_id":18},"MMERGE17":{"name":"MMERGE17","label":"Press Release - Arabic","helper_text":"","type":"text","required":false,"audience_field_name":"Press Release - Arabic","enabled":false,"order":null,"field_type":"merge","merge_id":17},"MMERGE16":{"name":"MMERGE16","label":"Press Release - Hebrew","helper_text":"","type":"text","required":false,"audience_field_name":"Press Release - Hebrew","enabled":false,"order":null,"field_type":"merge","merge_id":16},"MMERGE15":{"name":"MMERGE15","label":"Press Release - English","helper_text":"","type":"text","required":false,"audience_field_name":"Press Release - English","enabled":false,"order":null,"field_type":"merge","merge_id":15},"MMERGE14":{"name":"MMERGE14","label":"Newsletter - Hebrew","helper_text":"","type":"text","required":false,"audience_field_name":"Newsletter - Hebrew","enabled":false,"order":null,"field_type":"merge","merge_id":14},"MMERGE12":{"name":"MMERGE12","label":"Last Gift Date","helper_text":"","type":"date","required":false,"audience_field_name":"Last Gift Date","dateformat":"DD/MM/YYYY","enabled":false,"order":null,"field_type":"merge","merge_id":12},"MMERGE13":{"name":"MMERGE13","label":"Largest Gift","helper_text":"","type":"number","required":false,"audience_field_name":"Largest Gift","enabled":false,"order":null,"field_type":"merge","merge_id":13},"MMERGE11":{"name":"MMERGE11","label":"Last Gift Amount","helper_text":"","type":"number","required":false,"audience_field_name":"Last Gift Amount","enabled":false,"order":null,"field_type":"merge","merge_id":11},"MMERGE10":{"name":"MMERGE10","label":"Total Number of Gifts","helper_text":"","type":"number","required":false,"audience_field_name":"Total Number of Gifts","enabled":false,"order":null,"field_type":"merge","merge_id":10},"MMERGE8":{"name":"MMERGE8","label":"Total Gifts Amount","helper_text":"","type":"number","required":false,"audience_field_name":"Total Gifts Amount","enabled":false,"order":null,"field_type":"merge","merge_id":8},"ZIPPOSTALC":{"name":"ZIPPOSTALC","label":"Zip Postal Code","helper_text":"","type":"text","required":false,"audience_field_name":"Zip Postal Code","enabled":false,"order":null,"field_type":"merge","merge_id":9},"PRIMARYSTA":{"name":"PRIMARYSTA","label":"Primary State","helper_text":"","type":"text","required":false,"audience_field_name":"Primary State","enabled":false,"order":null,"field_type":"merge","merge_id":7},"PRIMARYSTR":{"name":"PRIMARYSTR","label":"Primary Street","helper_text":"","type":"text","required":false,"audience_field_name":"Primary Street","enabled":false,"order":null,"field_type":"merge","merge_id":6},"PRIMARYCIT":{"name":"PRIMARYCIT","label":"Primary City","helper_text":"","type":"text","required":false,"audience_field_name":"Primary City","enabled":false,"order":null,"field_type":"merge","merge_id":5},"PRIMARYCOU":{"name":"PRIMARYCOU","label":"Primary Country","helper_text":"","type":"text","required":false,"audience_field_name":"Primary Country","enabled":false,"order":null,"field_type":"merge","merge_id":4},"interests_2":{"name":"interests_2","label":"Group category 2","helper_text":"","type":"checkbox","required":false,"choices":[{"value":"1","label":"Group Name 1"}],"audience_field_name":"Group category 2","enabled":false,"order":null,"field_type":"group","group_id":2}}).find(function(f) { return f.name === fieldName && f.type === 'smsphone'; });
      var isRequired = smsField ? smsField.required : false;
      var shouldAppendCountryCode = smsNotRequiredRemoveCountryCodeEnabled ? isRequired : true;
      
      var phoneInput = document.querySelector('#mce-' + fieldName);
      if (phoneInput && defaultProgram.countryCallingCode && shouldAppendCountryCode) {
        phoneInput.value = defaultProgram.countryCallingCode;
      }
      


      displayFlag?.addEventListener('click', function(e) {
        dropdown.focus();
      });


      dropdown?.addEventListener('change', function() {
        const selectedCountry = this.value;
        
        if (!selectedCountry || typeof selectedCountry !== 'string') {
          return;
        }
        
        const flagSpan = displayFlag?.querySelector('#flag-emoji-' + fieldName);
        if (flagSpan) {
          flagSpan.textContent = getCountryUnicodeFlag(selectedCountry);
          flagSpan.setAttribute('aria-label', sanitizeHtml(selectedCountry) + ' flag');
        }

         
        const selectedProgram = window.MC?.smsPhoneData?.programs.find(function(program) {
          return program && program.countryCode === selectedCountry;
        });

        var smsNotRequiredRemoveCountryCodeEnabled = true;
        var smsField = Object.values({"EMAIL":{"name":"EMAIL","label":"Email Address","helper_text":"","type":"email","required":true,"audience_field_name":"Email Address","merge_id":0,"help_text_enabled":false,"enabled":true,"order":"0","field_type":"merge"},"FNAME":{"name":"FNAME","label":"שם פרטי","helper_text":"","type":"text","required":false,"audience_field_name":"First Name","merge_id":1,"help_text_enabled":false,"enabled":true,"order":"1","field_type":"merge"},"LNAME":{"name":"LNAME","label":"שם משפחה","helper_text":"","type":"text","required":false,"audience_field_name":"Last Name","merge_id":2,"help_text_enabled":false,"enabled":true,"order":"2","field_type":"merge"},"MMERGE3":{"name":"MMERGE3","label":"Newsletter - English","helper_text":"","type":"text","required":false,"audience_field_name":"Newsletter - English","enabled":false,"order":null,"field_type":"merge","merge_id":3},"MMERGE21":{"name":"MMERGE21","label":"International Media","helper_text":"","type":"text","required":false,"audience_field_name":"International Media","enabled":false,"order":null,"field_type":"merge","merge_id":21},"MMERGE20":{"name":"MMERGE20","label":"UN ISR-PAL","helper_text":"","type":"text","required":false,"audience_field_name":"UN ISR-PAL","enabled":false,"order":null,"field_type":"merge","merge_id":20},"MMERGE19":{"name":"MMERGE19","label":"Dip-Consulates","helper_text":"","type":"text","required":false,"audience_field_name":"Dip-Consulates","enabled":false,"order":null,"field_type":"merge","merge_id":19},"MMERGE18":{"name":"MMERGE18","label":"Dip-Embassies","helper_text":"","type":"text","required":false,"audience_field_name":"Dip-Embassies","enabled":false,"order":null,"field_type":"merge","merge_id":18},"MMERGE17":{"name":"MMERGE17","label":"Press Release - Arabic","helper_text":"","type":"text","required":false,"audience_field_name":"Press Release - Arabic","enabled":false,"order":null,"field_type":"merge","merge_id":17},"MMERGE16":{"name":"MMERGE16","label":"Press Release - Hebrew","helper_text":"","type":"text","required":false,"audience_field_name":"Press Release - Hebrew","enabled":false,"order":null,"field_type":"merge","merge_id":16},"MMERGE15":{"name":"MMERGE15","label":"Press Release - English","helper_text":"","type":"text","required":false,"audience_field_name":"Press Release - English","enabled":false,"order":null,"field_type":"merge","merge_id":15},"MMERGE14":{"name":"MMERGE14","label":"Newsletter - Hebrew","helper_text":"","type":"text","required":false,"audience_field_name":"Newsletter - Hebrew","enabled":false,"order":null,"field_type":"merge","merge_id":14},"MMERGE12":{"name":"MMERGE12","label":"Last Gift Date","helper_text":"","type":"date","required":false,"audience_field_name":"Last Gift Date","dateformat":"DD/MM/YYYY","enabled":false,"order":null,"field_type":"merge","merge_id":12},"MMERGE13":{"name":"MMERGE13","label":"Largest Gift","helper_text":"","type":"number","required":false,"audience_field_name":"Largest Gift","enabled":false,"order":null,"field_type":"merge","merge_id":13},"MMERGE11":{"name":"MMERGE11","label":"Last Gift Amount","helper_text":"","type":"number","required":false,"audience_field_name":"Last Gift Amount","enabled":false,"order":null,"field_type":"merge","merge_id":11},"MMERGE10":{"name":"MMERGE10","label":"Total Number of Gifts","helper_text":"","type":"number","required":false,"audience_field_name":"Total Number of Gifts","enabled":false,"order":null,"field_type":"merge","merge_id":10},"MMERGE8":{"name":"MMERGE8","label":"Total Gifts Amount","helper_text":"","type":"number","required":false,"audience_field_name":"Total Gifts Amount","enabled":false,"order":null,"field_type":"merge","merge_id":8},"ZIPPOSTALC":{"name":"ZIPPOSTALC","label":"Zip Postal Code","helper_text":"","type":"text","required":false,"audience_field_name":"Zip Postal Code","enabled":false,"order":null,"field_type":"merge","merge_id":9},"PRIMARYSTA":{"name":"PRIMARYSTA","label":"Primary State","helper_text":"","type":"text","required":false,"audience_field_name":"Primary State","enabled":false,"order":null,"field_type":"merge","merge_id":7},"PRIMARYSTR":{"name":"PRIMARYSTR","label":"Primary Street","helper_text":"","type":"text","required":false,"audience_field_name":"Primary Street","enabled":false,"order":null,"field_type":"merge","merge_id":6},"PRIMARYCIT":{"name":"PRIMARYCIT","label":"Primary City","helper_text":"","type":"text","required":false,"audience_field_name":"Primary City","enabled":false,"order":null,"field_type":"merge","merge_id":5},"PRIMARYCOU":{"name":"PRIMARYCOU","label":"Primary Country","helper_text":"","type":"text","required":false,"audience_field_name":"Primary Country","enabled":false,"order":null,"field_type":"merge","merge_id":4},"interests_2":{"name":"interests_2","label":"Group category 2","helper_text":"","type":"checkbox","required":false,"choices":[{"value":"1","label":"Group Name 1"}],"audience_field_name":"Group category 2","enabled":false,"order":null,"field_type":"group","group_id":2}}).find(function(f) { return f.name === fieldName && f.type === 'smsphone'; });
        var isRequired = smsField ? smsField.required : false;
        var shouldAppendCountryCode = smsNotRequiredRemoveCountryCodeEnabled ? isRequired : true;
        
        var phoneInput = document.querySelector('#mce-' + fieldName);
        if (phoneInput && selectedProgram.countryCallingCode && shouldAppendCountryCode) {
          phoneInput.value = selectedProgram.countryCallingCode;
        }
        
        
        updateSmsLegalText(selectedCountry, fieldName);
        updatePlaceholder(selectedCountry, fieldName);
        updateCountryCodeInstruction(selectedCountry, fieldName);
      });
    }

    document.addEventListener('DOMContentLoaded', function() {
      const smsPhoneFields = document.querySelectorAll('[id^="country-select-"]');
      
      smsPhoneFields.forEach(function(dropdown) {
        const fieldName = dropdown?.id.replace('country-select-', '');
        initializeSmsPhoneDropdown(fieldName);
      });
    });