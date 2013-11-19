
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

client_bin_opt = --compilation_level ADVANCED_OPTIMIZATIONS


##
## language defintions
##

# The language identifier if the basename of the language file.
langname = $(basename $(notdir $(1)))

# The language files are the .js files in $(lang_dir).
lang_src := $(wildcard $(lang_dir)/*.js)

# All the language identifiers.
languages := $(call langname,$(lang_src))

##
## client targets
##

# main client output
client_main_out = $(client_dir)/codenodes.js

# langugae-specific client output
client_lang_pattern := $(client_dir)/codenodes-lang-%.js
client_lang_out = $(patsubst %,$(client_lang_pattern),$(1))

# client code output
client_output := $(client_main_out) $(call client_lang_out,$(languages))

##
## dependencies
##
client_main_depts := $(wildcard $(addsuffix /*.js,$(lib_dir) $(core_dir) $(rules_dir)))

# language specific client code
$(client_lang_pattern) : $(lang_dir)/%.js $(client_main_out)
	$(nodejs) $(client_bin) -l $(call langname,$<) --externs $(client_main_out) --jscomp_off=externsValidation $(client_bin_opt) -o $@

# core client code
$(client_main_out) : $(client_main_depts)
	$(nodejs) $(client_bin) $(client_bin_opt) -o $@

client : $(client_output)

all: client



