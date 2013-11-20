
##
## local directories
##

# source directories
bin_dir = bin
lib_dir = lib
core_dir = $(lib_dir)/core
rules_dir = $(lib_dir)/rules
lang_dir = $(lib_dir)/lang

# generated client code
client_dir = client

##
## external executables
##
nodejs=/usr/local/bin/node

##
## project executables
##
client_bin = $(bin_dir)/client.js

client_options = --compilation_level ADVANCED_OPTIMIZATIONS
client_debug_options = --debug

##
## language defintions
##

# the language identifier if the basename of the language file
langname = $(basename $(notdir $(1)))

# the language files are the .js files in $(lang_dir)
lang_src := $(wildcard $(lang_dir)/*.js)

# all the language identifiers
languages := $(call langname,$(lang_src))

##
## client targets
##

# main client output
client_main_out = $(client_dir)/codenodes.js
client_main_debug := $(client_dir)/codenodes.debug.js

# language-specific client output
client_lang_pattern := $(client_dir)/codenodes-lang-%.js
client_lang_debug_pattern := $(client_dir)/codenodes-lang-%.debug.js

client_lang_map = $(patsubst %,$(client_lang_pattern),$(1))
client_lang_debug_map = $(patsubst %,$(client_lang_debug_pattern),$(1))

# complete client output
client_targets := $(client_main_out) $(call client_lang_map,$(languages))
client_debug_targets := $(client_main_debug) $(call client_lang_debug_map,$(languages))

##
## dependencies
##
client_main_deps := $(client_bin) \
  $(wildcard $(addsuffix /*.js,$(lib_dir) $(core_dir) $(rules_dir)))

##
## args
##
client_args := $(client_options)
client_lang_args := $(client_options) \
  --externs $(client_main_out) --jscomp_off=externsValidation
client_debug_args := $(client_debug_options)
client_lang_debug_args := $(client_debug_options)

##
## rules
##

all : client client-debug
.PHONY : all

client : $(client_targets)

client-debug : $(client_debug_targets)

# language specific client code (debug)
$(client_lang_debug_pattern) : $(lang_dir)/%.js
	$(nodejs) $(client_bin) -l $(call langname,$<) $(client_lang_debug_args) -o $@

# language specific client code
$(client_lang_pattern) : $(lang_dir)/%.js $(client_main_out)
	$(nodejs) $(client_bin) -l $(call langname,$<) $(client_lang_args) -o $@

# client main (debug)
$(client_main_debug) : $(client_main_deps)
	$(nodejs) $(client_bin) $(client_debug_args) -o $@

# client main
$(client_main_out) : $(client_main_deps)
	$(nodejs) $(client_bin) $(client_args) -o $@



